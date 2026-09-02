'use strict';

const coingecko = require('../services/coingecko.service');

const VALID_RANGES = { '30': 30, '90': 90, '365': 365 };

async function getHistory(req, res, next) {
  try {
    const { coinId } = req.params;
    const range = req.query.range ?? '90';

    const days = VALID_RANGES[String(range)];
    if (!days) {
      return res.status(400).json({
        error: { message: 'Invalid range. Use 30, 90, or 365', code: 'VALIDATION_ERROR' },
      });
    }

    const data = await coingecko.getHistoricalPrices(coinId, days);
    res.json({ coinId, range: days, prices: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory };
