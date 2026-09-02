'use strict';

const analyticsService = require('../services/analytics.service');

async function getSummary(req, res, next) {
  try {
    const data = await analyticsService.getSummary(+req.params.id, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
}

async function getRisk(req, res, next) {
  try {
    const data = await analyticsService.getRiskMetrics(+req.params.id, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
}

async function getCorrelation(req, res, next) {
  try {
    const data = await analyticsService.getCorrelationMatrix(+req.params.id, req.user.id);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { getSummary, getRisk, getCorrelation };
