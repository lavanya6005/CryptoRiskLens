'use strict';

const portfolioService = require('./portfolio.service');
const coingecko = require('./coingecko.service');
const math = require('../math/riskCalculations');
const env = require('../config/env');

const HISTORY_DAYS = 90; // used for volatility/Sharpe calculations

// ─── Portfolio Summary ────────────────────────────────────────────────────────

/**
 * Return total portfolio value, per-holding P&L, allocation %, and total invested.
 *
 * P&L per holding:
 *   currentValue  = currentPrice × quantity
 *   investedValue = buyPrice × quantity
 *   pnl           = currentValue − investedValue
 *   pnlPct        = (pnl / investedValue) × 100
 */
async function getSummary(portfolioId, userId) {
  const portfolio = await portfolioService.getOwnedPortfolio(portfolioId, userId);
  if (!portfolio.holdings.length) {
    return {
      portfolioId,
      name: portfolio.name,
      totalValue: 0,
      totalInvested: 0,
      totalPnl: 0,
      pnlPct: 0,
      holdings: [],
    };
  }

  const coinIds = portfolio.holdings.map((h) => h.coinId);
  const prices  = await coingecko.getLivePrices(coinIds);

  let totalValue    = 0;
  let totalInvested = 0;

  const enriched = portfolio.holdings.map((h) => {
    const priceData   = prices[h.coinId] ?? { usd: 0, usd_24h_change: 0 };
    const qty         = parseFloat(h.quantity.toString());
    const buyPrice    = parseFloat(h.buyPrice.toString());
    const currentPrice = priceData.usd;

    const currentValue  = qty * currentPrice;
    const investedValue = qty * buyPrice;
    const pnl    = currentValue - investedValue;
    const pnlPct = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

    totalValue    += currentValue;
    totalInvested += investedValue;

    return {
      holdingId: h.id,
      coinId:    h.coinId,
      quantity:  qty,
      buyPrice,
      currentPrice,
      currentValue,
      investedValue,
      pnl,
      pnlPct: Math.round(pnlPct * 100) / 100,
      change24h: priceData.usd_24h_change ?? 0,
    };
  });

  // Compute allocation % after totalValue is known
  const holdings = enriched.map((h) => ({
    ...h,
    allocation: totalValue > 0 ? Math.round((h.currentValue / totalValue) * 10000) / 100 : 0,
  }));

  const totalPnl = totalValue - totalInvested;
  const pnlPct   = totalInvested > 0 ? Math.round((totalPnl / totalInvested) * 10000) / 100 : 0;

  return { portfolioId, name: portfolio.name, totalValue, totalInvested, totalPnl, pnlPct, holdings };
}

// ─── Risk Metrics ─────────────────────────────────────────────────────────────

/**
 * Compute composite risk score with the sub-scores expected by the frontend:
 *   overallScore        0–100
 *   diversificationScore 0–100  (higher = more diversified = better)
 *   concentrationRisk   0–100  (higher = more concentrated = worse)
 *   marketVolatility    0–100
 *   liquidityScore      0–100  (higher = more liquid = better)
 *   factors             [{ name, score, level }]
 *   recommendation      string
 */
async function getRiskMetrics(portfolioId, userId) {
  const portfolio = await portfolioService.getOwnedPortfolio(portfolioId, userId);
  if (!portfolio.holdings.length) {
    const err = new Error('Portfolio has no holdings — cannot compute risk metrics');
    err.statusCode = 422;
    throw err;
  }

  // ── Fetch price history per coin ──────────────────────────────────────────
  const historiesByCoin = {};
  await Promise.all(
    portfolio.holdings.map(async (h) => {
      try {
        const series = await coingecko.getHistoricalPrices(h.coinId, HISTORY_DAYS);
        historiesByCoin[h.coinId] = series.map((p) => p.price);
      } catch { /* skip coins that fail */ }
    })
  );

  // ── Daily returns per coin ────────────────────────────────────────────────
  const returnsByCoin = {};
  for (const [coinId, prices] of Object.entries(historiesByCoin)) {
    if (prices.length >= 2) {
      try {
        returnsByCoin[coinId] = math.calculateDailyReturns(prices);
      } catch { /* skip */ }
    }
  }

  // ── Live prices → weights ─────────────────────────────────────────────────
  const livePrices = await coingecko.getLivePrices(portfolio.holdings.map((h) => h.coinId));
  const values = portfolio.holdings.map((h) => {
    const qty = parseFloat(h.quantity.toString());
    return qty * (livePrices[h.coinId]?.usd ?? 0);
  });
  const totalValue = values.reduce((s, v) => s + v, 0);
  const weights    = values.map((v) => (totalValue > 0 ? v / totalValue : 0));

  // ── Portfolio volatility ──────────────────────────────────────────────────
  const coinsWithData = portfolio.holdings
    .map((h) => h.coinId)
    .filter((id) => returnsByCoin[id]);

  let portfolioVolatility = 0;
  let weightedSharpe      = 0;
  let volatilityByCoin    = {};
  let sharpeRatios        = [];

  if (coinsWithData.length > 0) {
    for (const id of coinsWithData) {
      try {
        volatilityByCoin[id] = math.calculateVolatility(returnsByCoin[id]);
      } catch { volatilityByCoin[id] = 0; }
    }

    const weightsForCov = portfolio.holdings
      .filter((h) => returnsByCoin[h.coinId])
      .map((_, i) => weights[i] ?? 0);

    try {
      const covMatrix = math.calculateCovarianceMatrix(
        Object.fromEntries(coinsWithData.map((id) => [id, returnsByCoin[id]]))
      );
      const portfolioVariance = math.calculatePortfolioVariance(weightsForCov, covMatrix);
      portfolioVolatility = Math.sqrt(portfolioVariance) * Math.sqrt(365);
    } catch { /* fall back to weighted-average volatility */
      portfolioVolatility = coinsWithData.reduce(
        (s, id, i) => s + volatilityByCoin[id] * (weightsForCov[i] ?? 0), 0
      );
    }

    sharpeRatios = coinsWithData.map((id) => {
      try { return math.calculateSharpeRatio(returnsByCoin[id], env.RISK_FREE_RATE); }
      catch { return 0; }
    });
    weightedSharpe = sharpeRatios.reduce(
      (s, sr, i) => s + sr * (weights[portfolio.holdings.findIndex(h => h.coinId === coinsWithData[i])] ?? 0), 0
    );
  }

  // ── Overall risk score ────────────────────────────────────────────────────
  const overallScore = coinsWithData.length > 0
    ? math.calculateRiskScore(portfolioVolatility, weightedSharpe)
    : 50; // neutral default when no history available

  // ── Sub-scores ────────────────────────────────────────────────────────────
  const n = portfolio.holdings.length;

  // Diversification: 1 coin = 0%, 5+ coins = 100%
  const diversificationScore = Math.min(100, Math.round(((n - 1) / 4) * 100));

  // Concentration risk: max weight → 100% max weight = 100 risk
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 1;
  const concentrationRisk = Math.round(maxWeight * 100);

  // Market volatility: normalise annualised vol to 0–100 (200% vol = 100)
  const marketVolatility = Math.min(100, Math.round((portfolioVolatility / 2.0) * 100));

  // Liquidity score: well-known coins score high; derived from diversification + size
  const liquidityScore = Math.min(100, Math.max(0, 100 - concentrationRisk / 2));

  // ── Risk factors list ─────────────────────────────────────────────────────
  const factors = [
    {
      name:  'Diversification',
      score: diversificationScore,
      level: diversificationScore >= 60 ? 'good' : diversificationScore >= 30 ? 'moderate' : 'poor',
    },
    {
      name:  'Concentration Risk',
      score: concentrationRisk,
      level: concentrationRisk >= 70 ? 'high' : concentrationRisk >= 40 ? 'moderate' : 'low',
    },
    {
      name:  'Market Volatility',
      score: marketVolatility,
      level: marketVolatility >= 70 ? 'high' : marketVolatility >= 40 ? 'moderate' : 'low',
    },
    {
      name:  'Liquidity',
      score: liquidityScore,
      level: liquidityScore >= 70 ? 'good' : liquidityScore >= 40 ? 'moderate' : 'poor',
    },
  ];

  // ── Recommendation ────────────────────────────────────────────────────────
  let recommendation = '';
  if (concentrationRisk > 70) {
    recommendation = 'Your portfolio is heavily concentrated in a single asset. Consider diversifying into 4-6 different cryptocurrencies to reduce single-asset risk.';
  } else if (diversificationScore < 30) {
    recommendation = 'Adding more assets can reduce your overall portfolio risk through diversification.';
  } else if (marketVolatility > 70) {
    recommendation = 'High market volatility detected. Consider adding stablecoins (10-15%) to reduce drawdown exposure.';
  } else {
    recommendation = 'Your portfolio is reasonably balanced. Continue monitoring concentration and rebalance if any single asset exceeds 50% of total value.';
  }

  // ── Per-holding detail ─────────────────────────────────────────────────────
  const holdingDetails = portfolio.holdings.map((h, i) => ({
    coinId:     h.coinId,
    weight:     weights[i] ?? 0,
    volatility: volatilityByCoin[h.coinId] != null ? Math.round(volatilityByCoin[h.coinId] * 100) : null,
  }));

  return {
    portfolioId,
    name:               portfolio.name,
    // ── Overall ──
    overallScore,
    // ── Sub-scores (0–100 each) ──
    diversificationScore,
    concentrationRisk,
    marketVolatility,
    liquidityScore,
    // ── Detail ──
    factors,
    recommendation,
    holdings:           holdingDetails,
    // ── Raw metrics (for future use) ──
    volatility:         portfolioVolatility,
    sharpeRatio:        weightedSharpe,
  };
}

// ─── Correlation Matrix ───────────────────────────────────────────────────────

/**
 * Compute the Pearson correlation matrix for all coins in the portfolio.
 */
async function getCorrelationMatrix(portfolioId, userId) {
  const portfolio = await portfolioService.getOwnedPortfolio(portfolioId, userId);
  if (portfolio.holdings.length < 2) {
    const err = new Error('Correlation matrix requires at least 2 holdings');
    err.statusCode = 422;
    throw err;
  }

  const returnsByCoin = {};
  await Promise.all(
    portfolio.holdings.map(async (h) => {
      try {
        const series = await coingecko.getHistoricalPrices(h.coinId, HISTORY_DAYS);
        const prices = series.map((p) => p.price);
        if (prices.length >= 2) {
          returnsByCoin[h.coinId] = math.calculateDailyReturns(prices);
        }
      } catch { /* skip */ }
    })
  );

  const coinIds = Object.keys(returnsByCoin);
  if (coinIds.length < 2) {
    const err = new Error('Insufficient history for correlation matrix');
    err.statusCode = 422;
    throw err;
  }

  // FIX #3: calculateCorrelationMatrix handles mismatched lengths internally
  const matrix = math.calculateCorrelationMatrix(returnsByCoin);

  return { portfolioId, coins: coinIds, matrix };
}

module.exports = { getSummary, getRiskMetrics, getCorrelationMatrix };
