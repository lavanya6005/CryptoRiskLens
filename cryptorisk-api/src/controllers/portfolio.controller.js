'use strict';

const portfolioService = require('../services/portfolio.service');

async function createPortfolio(req, res, next) {
  try {
    const portfolio = await portfolioService.createPortfolio(req.user.id, req.body.name);
    res.status(201).json(portfolio);
  } catch (err) { next(err); }
}

async function listPortfolios(req, res, next) {
  try {
    const portfolios = await portfolioService.listPortfolios(req.user.id);
    res.json(portfolios);
  } catch (err) { next(err); }
}

async function getPortfolio(req, res, next) {
  try {
    const portfolio = await portfolioService.getPortfolio(+req.params.id, req.user.id);
    res.json(portfolio);
  } catch (err) { next(err); }
}

async function updatePortfolio(req, res, next) {
  try {
    const portfolio = await portfolioService.updatePortfolio(
      +req.params.id, req.user.id, req.body.name
    );
    res.json(portfolio);
  } catch (err) { next(err); }
}

async function deletePortfolio(req, res, next) {
  try {
    await portfolioService.deletePortfolio(+req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

async function addHolding(req, res, next) {
  try {
    const holding = await portfolioService.addHolding(
      +req.params.id, req.user.id, req.body.coinId, req.body.quantity
    );
    res.status(201).json(holding);
  } catch (err) { next(err); }
}

async function updateHolding(req, res, next) {
  try {
    const holding = await portfolioService.updateHolding(
      +req.params.id, req.user.id, +req.params.holdingId, req.body.quantity
    );
    res.json(holding);
  } catch (err) { next(err); }
}

async function deleteHolding(req, res, next) {
  try {
    await portfolioService.deleteHolding(
      +req.params.id, req.user.id, +req.params.holdingId
    );
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = {
  createPortfolio, listPortfolios, getPortfolio,
  updatePortfolio, deletePortfolio,
  addHolding, updateHolding, deleteHolding,
};
