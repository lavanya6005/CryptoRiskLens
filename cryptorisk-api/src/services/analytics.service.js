'use strict';

const portfolioService = require('./portfolio.service');
const coingecko = require('./coingecko.service');
const math = require('../math/riskCalculations');
const env = require('../config/env');

const HISTORY_DAYS = 90; // used for volatility/Sharpe calculations

// ─── Portfolio Summary ────────────────────────────────────────────────────────

/**
 * Return total portfolio value, per-coin allocation %, and 24h change.
 */
async function getSummary(portfolioId, userId) {
  const portfolio = await portfolioService.getOwnedPortfolio(portfolioId, userId);
  if (!portfolio.holdings.length) {
    return { totalValue: 0, holdings: [], portfolioId, name: portfolio.name };
  }

  const coinIds = portfolio.holdings.map((h) => h.coinId);
  const prices = await coingecko.getLivePrices(coinIds);

  let totalValue = 0;
  const enriched = portfolio.holdings.map((h) => {
    const priceData = prices[h.coinId] ?? { usd: 0, usd_24h_change: 0 };
    const qty = parseFloat(h.quantity.toString());
    const value = qty * priceData.usd;
    totalValue += value;
    return {
      holdingId: h.id,
      coinId: h.coinId,
      quantity: qty,
      currentPrice: priceData.usd,
      change24h: priceData.usd_24h_change ?? 0,
      value,
    };
  });

  const holdings = enriched.map((h) => ({
    ...h,
    allocation: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
  }));

  return { portfolioId, name: portfolio.name, totalValue, holdings };
}

// ─── Risk Metrics ─────────────────────────────────────────────────────────────

/**
 * Compute volatility, Sharpe ratio, portfolio variance, and composite risk score.
 */
async function getRiskMetrics(portfolioId, userId) {
  const portfolio = await portfolioService.getOwnedPortfolio(portfolioId, userId);
  if (!portfolio.holdings.length) {
    const err = new Error('Portfolio has no holdings — cannot compute risk metrics');
    err.statusCode = 422;
    throw err;
  }

  // Fetch price history per coin
  const historiesByCoin = {};
  await Promise.all(
    portfolio.holdings.map(async (h) => {
      const series = await coingecko.getHistoricalPrices(h.coinId, HISTORY_DAYS);
      historiesByCoin[h.coinId] = series.map((p) => p.price);
    })
  );

  // Compute daily returns per coin
  const returnsByCoin = {};
  for (const [coinId, prices] of Object.entries(historiesByCoin)) {
    if (prices.length >= 2) {
      returnsByCoin[coinId] = math.calculateDailyReturns(prices);
    }
  }

  if (!Object.keys(returnsByCoin).length) {
    const err = new Error('Insufficient price history to compute risk metrics');
    err.statusCode = 422;
    throw err;
  }

  // Compute per-coin volatility
  const volatilityByCoin = {};
  for (const [coinId, returns] of Object.entries(returnsByCoin)) {
    volatilityByCoin[coinId] = math.calculateVolatility(returns);
  }

  // Compute portfolio weights from current values
  const livePrices = await coingecko.getLivePrices(portfolio.holdings.map((h) => h.coinId));
  const values = portfolio.holdings.map((h) => {
    const qty = parseFloat(h.quantity.toString());
    return qty * (livePrices[h.coinId]?.usd ?? 0);
  });
  const totalValue = values.reduce((s, v) => s + v, 0);
  const weights = values.map((v) => (totalValue > 0 ? v / totalValue : 0));

  // Covariance matrix + portfolio variance (only for coins with return data)
  const coinsWithData = portfolio.holdings
    .map((h) => h.coinId)
    .filter((id) => returnsByCoin[id]);

  const covMatrix = math.calculateCovarianceMatrix(
    Object.fromEntries(coinsWithData.map((id) => [id, returnsByCoin[id]]))
  );

  const weightsForCov = portfolio.holdings
    .filter((h) => returnsByCoin[h.coinId])
    .map((_, i) => weights[i] ?? 0);

  const portfolioVariance = math.calculatePortfolioVariance(weightsForCov, covMatrix);
  const portfolioVolatility = Math.sqrt(portfolioVariance) * Math.sqrt(365);

  // Weighted-average Sharpe ratio across coins
  const sharpeRatios = coinsWithData.map((id) =>
    math.calculateSharpeRatio(returnsByCoin[id], env.RISK_FREE_RATE)
  );
  const weightedSharpe =
    sharpeRatios.reduce((s, sr, i) => s + sr * (weightsForCov[i] ?? 0), 0);

  const riskScore = math.calculateRiskScore(portfolioVolatility, weightedSharpe);

  return {
    portfolioId,
    name: portfolio.name,
    volatility: portfolioVolatility,
    sharpeRatio: weightedSharpe,
    portfolioVariance,
    riskScore,
    byAsset: coinsWithData.map((coinId, i) => ({
      coinId,
      weight: weightsForCov[i],
      volatility: volatilityByCoin[coinId],
      sharpeRatio: sharpeRatios[i],
    })),
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
      const series = await coingecko.getHistoricalPrices(h.coinId, HISTORY_DAYS);
      const prices = series.map((p) => p.price);
      if (prices.length >= 2) {
        returnsByCoin[h.coinId] = math.calculateDailyReturns(prices);
      }
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
