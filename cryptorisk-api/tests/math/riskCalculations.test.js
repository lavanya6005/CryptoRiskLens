'use strict';

const {
  calculateDailyReturns,
  calculateVolatility,
  calculateSharpeRatio,
  calculateCovarianceMatrix,
  calculateCorrelationMatrix,
  calculatePortfolioVariance,
  calculateRiskScore,
  MIN_OVERLAP,
} = require('../../src/math/riskCalculations');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a linearly increasing price series for deterministic tests. */
function linearPrices(start, step, count) {
  return Array.from({ length: count }, (_, i) => start + i * step);
}

/** Generate a flat price series (all same value). */
function flatPrices(value, count) {
  return Array(count).fill(value);
}

/** Compute the population std dev of an array (for assertion baselines). */
function stdDev(arr) {
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ─── calculateDailyReturns ────────────────────────────────────────────────────

describe('calculateDailyReturns', () => {
  test('computes correct returns for a known series', () => {
    const prices = [100, 110, 99, 108];
    const returns = calculateDailyReturns(prices);
    expect(returns).toHaveLength(3);
    expect(returns[0]).toBeCloseTo(0.1);      // (110-100)/100
    expect(returns[1]).toBeCloseTo(-0.1);     // (99-110)/110
    expect(returns[2]).toBeCloseTo(0.0909, 3); // (108-99)/99
  });

  test('returns length is prices.length - 1', () => {
    const prices = linearPrices(100, 5, 20);
    expect(calculateDailyReturns(prices)).toHaveLength(19);
  });

  test('throws for fewer than 2 prices', () => {
    expect(() => calculateDailyReturns([100])).toThrow();
    expect(() => calculateDailyReturns([])).toThrow();
  });

  test('throws for zero price in denominator', () => {
    expect(() => calculateDailyReturns([0, 100])).toThrow(/zero/i);
  });
});

// ─── calculateVolatility ─────────────────────────────────────────────────────

describe('calculateVolatility', () => {
  test('returns annualised value (dailyStdDev * sqrt(365))', () => {
    const prices = linearPrices(100, 1, 31);   // 30 returns
    const returns = calculateDailyReturns(prices);
    const dailyStd = stdDev(returns);
    const expected = dailyStd * Math.sqrt(365);
    expect(calculateVolatility(returns)).toBeCloseTo(expected, 8);
  });

  test('is always non-negative', () => {
    const returns = calculateDailyReturns(linearPrices(50, 3, 20));
    expect(calculateVolatility(returns)).toBeGreaterThanOrEqual(0);
  });

  test('throws for fewer than 2 returns', () => {
    expect(() => calculateVolatility([0.01])).toThrow();
  });
});

// ─── calculateSharpeRatio — FIX #2 REGRESSION TESTS ─────────────────────────

describe('calculateSharpeRatio — period alignment (Fix #2)', () => {
  /**
   * Core regression test: verifies the function correctly ANNUALISES daily
   * returns before applying the annual rfr, rather than using the raw daily mean.
   *
   * With 365 data points of exactly 0.1% daily return:
   *   annualised return ≈ 0.001 × 365 = 0.365 (36.5%)
   *   annualised vol    ≈ 0 (constant returns → near-zero std dev)
   *
   * If annualisation were accidentally dropped, the numerator would be
   *   0.001 - 0.05 = -0.049 (negative → wrong sign in this regime).
   *
   * We test the sign and rough magnitude to catch that regression.
   */
  test('annualises daily returns before subtracting annual rfr', () => {
    // Constant daily return of 0.1% = 0.001 per day
    // Annualised: 0.001 * 365 = 0.365 → positive excess return over rfr=0.05
    const returns = Array(365).fill(0.001);
    const rfr = 0.05; // 5% annual

    // Without annualisation the numerator would be 0.001 - 0.05 = -0.049 (negative)
    // With annualisation the numerator would be 0.365 - 0.05 = 0.315 (positive)
    const sharpe = calculateSharpeRatio(returns, rfr);
    expect(sharpe).toBeGreaterThan(0); // fails if annualisation is missing
  });

  test('regression: dropping annualisation would flip sign for 0.1% daily return', () => {
    // 0.001 (daily) - 0.05 (annual) is negative WITHOUT annualisation
    // This test would FAIL if someone accidentally reverted to raw daily mean
    const rawDailyMean = 0.001;
    const rfr = 0.05;
    // Raw (wrong) numerator is negative
    expect(rawDailyMean - rfr).toBeLessThan(0);
    // Annualised (correct) numerator is positive
    expect(rawDailyMean * 365 - rfr).toBeGreaterThan(0);
    // Confirm function uses annualised path
    const returns = Array(100).fill(rawDailyMean);
    const sharpe = calculateSharpeRatio(returns, rfr);
    expect(sharpe).toBeGreaterThan(0);
  });

  test('sharpe is near 0 when rfr exactly matches annualised return', () => {
    // Build a returns series with genuine variance (not constant) so vol > 0.
    // Mean daily return = 0.001. Annualised = 0.001 * 365 = 0.365.
    // Set rfr = 0.365 so the excess return numerator ≈ 0.
    const base = 0.001;
    const returns = Array.from({ length: 90 }, (_, i) =>
      base + (i % 2 === 0 ? 0.002 : -0.002) // oscillating noise keeps mean ≈ base
    );
    const meanDaily = returns.reduce((s, v) => s + v, 0) / returns.length;
    const rfr = meanDaily * 365; // rfr exactly equals annualised return

    const sharpe = calculateSharpeRatio(returns, rfr);
    // Numerator ≈ 0, so Sharpe should be very close to 0
    expect(Math.abs(sharpe)).toBeLessThan(0.01);
  });


  test('higher rfr reduces Sharpe ratio', () => {
    const returns = Array(90).fill(0.002); // ~73% annualised
    const sharpe5 = calculateSharpeRatio(returns, 0.05);
    const sharpe10 = calculateSharpeRatio(returns, 0.10);
    expect(sharpe5).toBeGreaterThan(sharpe10);
  });

  test('throws for invalid rfr', () => {
    const returns = Array(30).fill(0.001);
    expect(() => calculateSharpeRatio(returns, NaN)).toThrow(/rfr/i);
    expect(() => calculateSharpeRatio(returns, 'five')).toThrow();
  });
});

// ─── calculateCorrelationMatrix — FIX #3 TESTS ───────────────────────────────

describe('calculateCorrelationMatrix — overlap handling (Fix #3)', () => {
  const makeReturns = (n, base = 0.01) =>
    Array.from({ length: n }, (_, i) => base + i * 0.0001);

  // ── Case 1: Equal-length series ──

  test('equal-length series: self-correlation is 1', () => {
    const map = {
      btc: makeReturns(30),
      eth: makeReturns(30, 0.02),
    };
    const matrix = calculateCorrelationMatrix(map);
    expect(matrix[0][0]).toBeCloseTo(1, 5);
    expect(matrix[1][1]).toBeCloseTo(1, 5);
  });

  test('equal-length series: correlation is symmetric', () => {
    const map = {
      btc: makeReturns(30),
      eth: makeReturns(30, 0.015),
    };
    const matrix = calculateCorrelationMatrix(map);
    expect(matrix[0][1]).toBeCloseTo(matrix[1][0], 8);
  });

  test('equal-length perfectly correlated series → correlation ≈ 1', () => {
    const series = makeReturns(30);
    const map = { btc: series, eth: series.map((v) => v * 2) }; // same direction, scaled
    const matrix = calculateCorrelationMatrix(map);
    expect(matrix[0][1]).toBeCloseTo(1, 3);
  });

  // ── Case 2: Mismatched-length series ──

  test('mismatched-length series: uses trailing overlap, produces valid result', () => {
    // btc has 90 returns, sol has 30 returns → overlap = 30
    const btcReturns = makeReturns(90);
    const solReturns = makeReturns(30, 0.015);
    const map = { btc: btcReturns, sol: solReturns };

    // Should NOT throw — 30 >= MIN_OVERLAP
    expect(() => calculateCorrelationMatrix(map)).not.toThrow();
    const matrix = calculateCorrelationMatrix(map);
    // Each diagonal is 1
    expect(matrix[0][0]).toBeCloseTo(1, 5);
    expect(matrix[1][1]).toBeCloseTo(1, 5);
    // Off-diagonals are symmetric
    expect(matrix[0][1]).toBeCloseTo(matrix[1][0], 8);
    // Correlation is in [-1, 1]
    expect(matrix[0][1]).toBeGreaterThanOrEqual(-1);
    expect(matrix[0][1]).toBeLessThanOrEqual(1);
  });

  test('mismatched-length series: 3-coin portfolio with different lengths', () => {
    const map = {
      btc:  makeReturns(365),
      eth:  makeReturns(180, 0.02),
      sol:  makeReturns(30, 0.03),
    };
    expect(() => calculateCorrelationMatrix(map)).not.toThrow();
    const matrix = calculateCorrelationMatrix(map);
    expect(matrix).toHaveLength(3);
    matrix.forEach((row) => expect(row).toHaveLength(3));
  });

  // ── Case 3: Overlap too small ──

  test('throws descriptive error when overlap < MIN_OVERLAP', () => {
    const map = {
      btc: makeReturns(50),
      newcoin: makeReturns(MIN_OVERLAP - 1), // 9 points < 10 minimum
    };
    expect(() => calculateCorrelationMatrix(map)).toThrow(
      new RegExp(`need ${MIN_OVERLAP} points`, 'i')
    );
  });

  test('throws and mentions both coin names in the error message', () => {
    const map = {
      bitcoin: makeReturns(30),
      newToken: makeReturns(5),
    };
    expect(() => calculateCorrelationMatrix(map))
      .toThrow(/bitcoin.*newToken|newToken.*bitcoin/i);
  });

  test('exactly MIN_OVERLAP points: does NOT throw', () => {
    const map = {
      btc: makeReturns(50),
      newcoin: makeReturns(MIN_OVERLAP), // exactly the minimum
    };
    expect(() => calculateCorrelationMatrix(map)).not.toThrow();
  });

  test('empty map throws', () => {
    expect(() => calculateCorrelationMatrix({})).toThrow();
  });
});

// ─── calculateCovarianceMatrix ────────────────────────────────────────────────

describe('calculateCovarianceMatrix', () => {
  test('diagonal is always positive (self-covariance = variance)', () => {
    const returns = { a: [0.01, 0.02, -0.01, 0.03, 0.01] };
    const matrix = calculateCovarianceMatrix(returns);
    expect(matrix[0][0]).toBeGreaterThan(0);
  });

  test('matrix is symmetric', () => {
    const map = {
      a: [0.01, 0.02, -0.01, 0.03, 0.01],
      b: [0.02, -0.01, 0.03, 0.01, 0.04],
    };
    const matrix = calculateCovarianceMatrix(map);
    expect(matrix[0][1]).toBeCloseTo(matrix[1][0], 8);
  });
});

// ─── calculatePortfolioVariance ───────────────────────────────────────────────

describe('calculatePortfolioVariance', () => {
  test('single-asset portfolio variance equals its own variance', () => {
    const returns = [0.01, 0.02, -0.01, 0.03, 0.01, 0.005];
    const map = { a: returns };
    const covMatrix = calculateCovarianceMatrix(map);
    const variance = calculatePortfolioVariance([1], covMatrix);
    // Should equal variance of returns series
    const expectedVariance = _sampleVariance(returns);
    expect(variance).toBeCloseTo(expectedVariance, 8);
  });

  test('50/50 equal-weight two-asset portfolio', () => {
    const a = [0.01, 0.02, -0.01, 0.03, 0.01];
    const b = [0.02, -0.01, 0.03, 0.01, 0.04];
    const covMatrix = calculateCovarianceMatrix({ a, b });
    const variance = calculatePortfolioVariance([0.5, 0.5], covMatrix);
    expect(variance).toBeGreaterThanOrEqual(0);
  });

  test('throws if weights and matrix dimensions mismatch', () => {
    const cov = [[1, 0], [0, 1]];
    expect(() => calculatePortfolioVariance([1], cov)).toThrow();
  });
});

// ─── calculateRiskScore ───────────────────────────────────────────────────────

describe('calculateRiskScore', () => {
  test('output is always in [0, 100]', () => {
    const cases = [
      [0, 3],     // very low vol, excellent Sharpe
      [2.5, -3],  // extreme vol, terrible Sharpe
      [0.8, 1.2], // typical crypto
      [0.5, 0],   // neutral Sharpe
    ];
    cases.forEach(([vol, sharpe]) => {
      const score = calculateRiskScore(vol, sharpe);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  test('higher volatility → higher risk score', () => {
    const s1 = calculateRiskScore(0.3, 1);
    const s2 = calculateRiskScore(0.9, 1);
    expect(s2).toBeGreaterThan(s1);
  });

  test('better Sharpe → lower risk score', () => {
    const s1 = calculateRiskScore(0.6, -1); // bad Sharpe
    const s2 = calculateRiskScore(0.6, 2);  // good Sharpe
    expect(s1).toBeGreaterThan(s2);
  });

  test('returns an integer', () => {
    expect(Number.isInteger(calculateRiskScore(0.5, 1))).toBe(true);
  });
});

// ─── Internal helper for tests ────────────────────────────────────────────────

function _sampleVariance(arr) {
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (arr.length - 1);
}
