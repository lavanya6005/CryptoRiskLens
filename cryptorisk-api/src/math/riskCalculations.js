'use strict';

/**
 * Pure, side-effect-free math/statistics functions for portfolio risk analysis.
 * All functions operate only on plain numbers/arrays — no DB or network calls.
 * This isolation makes them trivially unit-testable.
 */

// ─── Daily Returns ────────────────────────────────────────────────────────────

/**
 * Compute percentage daily returns from an ordered price series.
 * Returns array of length (prices.length - 1).
 *
 * @param {number[]} prices  Chronologically ordered price series
 * @returns {number[]}       Daily return for each consecutive pair
 */
function calculateDailyReturns(prices) {
  if (!Array.isArray(prices) || prices.length < 2) {
    throw new Error('calculateDailyReturns requires at least 2 prices');
  }
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    if (prev === 0) throw new Error(`Price at index ${i - 1} is zero — cannot compute return`);
    returns.push((prices[i] - prev) / prev);
  }
  return returns;
}

// ─── Volatility ───────────────────────────────────────────────────────────────

/**
 * Compute annualised volatility as the standard deviation of daily returns
 * scaled by sqrt(365) for crypto markets (which trade every day of the year).
 *
 * @param {number[]} returns  Daily returns
 * @returns {number}          Annualised volatility (e.g. 0.80 = 80%)
 */
function calculateVolatility(returns) {
  if (!Array.isArray(returns) || returns.length < 2) {
    throw new Error('calculateVolatility requires at least 2 return values');
  }
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const dailyStdDev = Math.sqrt(variance);
  // Annualise: crypto trades 365 days/year
  return dailyStdDev * Math.sqrt(365);
}

// ─── Sharpe Ratio ─────────────────────────────────────────────────────────────

/**
 * Compute the Sharpe ratio from daily returns and an annual risk-free rate.
 *
 * FIX #2 — Period alignment approach:
 *   We ANNUALISE the daily return series before applying the annual risk-free
 *   rate, rather than converting the annual rfr to a daily rate. Both approaches
 *   are mathematically equivalent, but annualising returns keeps the intuition
 *   clear: "annual excess return per unit of annual risk".
 *
 *   Annualised portfolio return = mean(daily returns) × 365
 *   Annualised volatility       = stdDev(daily returns) × sqrt(365)
 *   Sharpe ratio                = (annualReturn - rfr) / annualisedVol
 *
 * Convention: rfr is an annual decimal rate (e.g. 0.05 for 5%).
 * Both the numerator and denominator are now in "annual" units, so the ratio
 * is dimensionally consistent.
 *
 * @param {number[]} returns     Daily return series
 * @param {number}   rfr         Annual risk-free rate as a decimal (e.g. 0.05)
 * @returns {number}             Sharpe ratio (dimensionless)
 */
function calculateSharpeRatio(returns, rfr) {
  if (!Array.isArray(returns) || returns.length < 2) {
    throw new Error('calculateSharpeRatio requires at least 2 return values');
  }
  if (typeof rfr !== 'number' || isNaN(rfr)) {
    throw new Error('rfr must be a finite number');
  }

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;

  // Annualise mean daily return (crypto: 365 trading days)
  const annualisedReturn = mean * 365;

  // Re-use calculateVolatility which already annualises
  const annualisedVol = calculateVolatility(returns);

  if (annualisedVol === 0) return 0; // flat series → undefined ratio → treat as 0

  return (annualisedReturn - rfr) / annualisedVol;
}

// ─── Covariance & Correlation ─────────────────────────────────────────────────

/**
 * Compute the sample covariance between two equal-length return series.
 * (Internal helper — not exported.)
 */
function _covariance(a, b) {
  if (a.length !== b.length || a.length < 2) {
    throw new Error('_covariance: arrays must have equal length >= 2');
  }
  const meanA = a.reduce((s, v) => s + v, 0) / a.length;
  const meanB = b.reduce((s, v) => s + v, 0) / b.length;
  let cov = 0;
  for (let i = 0; i < a.length; i++) {
    cov += (a[i] - meanA) * (b[i] - meanB);
  }
  return cov / (a.length - 1);
}

/**
 * Compute the Pearson correlation coefficient between two equal-length series.
 * (Internal helper — not exported.)
 */
function _pearson(a, b) {
  const cov = _covariance(a, b);
  const stdA = Math.sqrt(_covariance(a, a));
  const stdB = Math.sqrt(_covariance(b, b));
  if (stdA === 0 || stdB === 0) return 0; // constant series → no correlation
  return cov / (stdA * stdB);
}

/**
 * Compute the full covariance matrix for a set of assets.
 *
 * @param {Record<string, number[]>} returnsByCoin  Map of coinId → daily returns array
 * @returns {number[][]}  N×N covariance matrix (N = number of coins)
 */
function calculateCovarianceMatrix(returnsByCoin) {
  const coins = Object.keys(returnsByCoin);
  const n = coins.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = _covariance(returnsByCoin[coins[i]], returnsByCoin[coins[j]]);
    }
  }
  return matrix;
}

/**
 * Compute the Pearson correlation matrix for all coin pairs.
 *
 * FIX #3 — Mismatched history lengths:
 *   Coins may have different listing dates, so their return series can be
 *   different lengths. For each pairwise calculation we:
 *     1. Align by taking the SUFFIX of the longer series that matches the
 *        length of the shorter series (most recent data).
 *     2. Require at least MIN_OVERLAP overlapping points; throw a descriptive
 *        error if the overlap is too small to be statistically meaningful.
 *
 *   This is intentionally simple alignment (tail-align) rather than date-key
 *   alignment; the analytics service is responsible for passing date-indexed
 *   data if strict date alignment is needed. This function handles the common
 *   case of a newly-listed coin having fewer historical data points.
 *
 * @param {Record<string, number[]>} returnsByCoin  Map of coinId → daily returns
 * @returns {number[][]}   N×N correlation matrix
 * @throws  If any coin pair has fewer than MIN_OVERLAP overlapping data points
 */
const MIN_OVERLAP = 10;

function calculateCorrelationMatrix(returnsByCoin) {
  const coins = Object.keys(returnsByCoin);
  const n = coins.length;
  if (n === 0) throw new Error('calculateCorrelationMatrix: no coins provided');

  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1; // perfect self-correlation
        continue;
      }

      const seriesA = returnsByCoin[coins[i]];
      const seriesB = returnsByCoin[coins[j]];

      // FIX #3: Compute overlap length (tail-align — most recent N points)
      const overlap = Math.min(seriesA.length, seriesB.length);

      if (overlap < MIN_OVERLAP) {
        throw new Error(
          `Insufficient overlapping data for correlation between ` +
          `"${coins[i]}" and "${coins[j]}": need ${MIN_OVERLAP} points, ` +
          `got ${overlap}. Add more historical data for the shorter series.`
        );
      }

      // Slice both series to the common trailing overlap window
      const alignedA = seriesA.slice(seriesA.length - overlap);
      const alignedB = seriesB.slice(seriesB.length - overlap);

      matrix[i][j] = _pearson(alignedA, alignedB);
    }
  }

  return matrix;
}

// ─── Portfolio Variance ───────────────────────────────────────────────────────

/**
 * Compute portfolio variance using the weighted covariance matrix.
 * Formula: σ²_p = wᵀ · Cov · w
 *
 * This correctly accounts for cross-asset correlations and uses portfolio
 * weights — NOT a simple average of individual variances.
 *
 * @param {number[]}   weights          Asset weights (must sum to 1)
 * @param {number[][]} covarianceMatrix N×N covariance matrix
 * @returns {number}  Portfolio variance
 */
function calculatePortfolioVariance(weights, covarianceMatrix) {
  const n = weights.length;
  if (covarianceMatrix.length !== n || covarianceMatrix.some((row) => row.length !== n)) {
    throw new Error('calculatePortfolioVariance: weights and matrix dimensions must match');
  }

  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * covarianceMatrix[i][j];
    }
  }
  return variance;
}

// ─── Composite Risk Score ─────────────────────────────────────────────────────

/**
 * Produce a normalised 0–100 composite risk score.
 *
 * Scoring components:
 *   - Volatility component (60% weight): benchmarked against 0% (score 0) and
 *     200% annualised volatility (score 100). Capped at 100.
 *   - Sharpe component (40% weight): negative Sharpe adds risk; good Sharpe
 *     reduces it. A Sharpe of –2 maps to +40 extra points; Sharpe of +3 maps
 *     to 0 extra points.
 *
 * @param {number} volatility   Annualised portfolio volatility (e.g. 0.8 = 80%)
 * @param {number} sharpeRatio  Portfolio Sharpe ratio
 * @returns {number}            Risk score in [0, 100]
 */
function calculateRiskScore(volatility, sharpeRatio) {
  // Volatility component: 0% vol → 0 pts, 200% vol → 60 pts
  const volScore = Math.min((volatility / 2.0) * 60, 60);

  // Sharpe component: reward good Sharpe, penalise negative Sharpe
  // Clamp Sharpe to [-2, 3] before mapping to avoid extreme outliers
  const clampedSharpe = Math.max(-2, Math.min(3, sharpeRatio));
  // Map [-2, 3] → [40, 0]: higher Sharpe → lower risk contribution
  const sharpeScore = ((3 - clampedSharpe) / 5) * 40;

  const raw = volScore + sharpeScore;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  calculateDailyReturns,
  calculateVolatility,
  calculateSharpeRatio,
  calculateCovarianceMatrix,
  calculateCorrelationMatrix,
  calculatePortfolioVariance,
  calculateRiskScore,
  MIN_OVERLAP, // exported so tests can reference the constant
};
