'use strict';

const prisma = require('../config/database');

// ─── Ownership guard ──────────────────────────────────────────────────────────

/**
 * Fetch a portfolio and verify it belongs to the given userId.
 * Throws 404 if not found, 403 if owned by someone else.
 */
async function getOwnedPortfolio(portfolioId, userId) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: { holdings: true },
  });

  if (!portfolio) {
    const err = new Error('Portfolio not found');
    err.statusCode = 404;
    throw err;
  }

  if (portfolio.userId !== userId) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return portfolio;
}

// ─── Portfolio CRUD ───────────────────────────────────────────────────────────

async function createPortfolio(userId, name) {
  return prisma.portfolio.create({ data: { userId, name }, include: { holdings: true } });
}

async function listPortfolios(userId) {
  return prisma.portfolio.findMany({
    where: { userId },
    include: { holdings: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getPortfolio(portfolioId, userId) {
  return getOwnedPortfolio(portfolioId, userId);
}

async function updatePortfolio(portfolioId, userId, name) {
  await getOwnedPortfolio(portfolioId, userId);
  return prisma.portfolio.update({
    where: { id: portfolioId },
    data: { name },
    include: { holdings: true },
  });
}

async function deletePortfolio(portfolioId, userId) {
  await getOwnedPortfolio(portfolioId, userId);
  // Holdings are cascade-deleted by the DB (FIX #5)
  return prisma.portfolio.delete({ where: { id: portfolioId } });
}

// ─── Holdings CRUD ────────────────────────────────────────────────────────────

async function addHolding(portfolioId, userId, coinId, quantity, buyPrice) {
  await getOwnedPortfolio(portfolioId, userId);

  // Use upsert: if the coin is already in the portfolio, update quantity + buyPrice
  return prisma.holding.upsert({
    where:  { portfolioId_coinId: { portfolioId, coinId } },
    update: { quantity, buyPrice },
    create: { portfolioId, coinId, quantity, buyPrice },
  });
}


async function updateHolding(portfolioId, userId, holdingId, quantity) {
  await getOwnedPortfolio(portfolioId, userId);

  const holding = await prisma.holding.findUnique({ where: { id: holdingId } });
  if (!holding || holding.portfolioId !== portfolioId) {
    const err = new Error('Holding not found in this portfolio');
    err.statusCode = 404;
    throw err;
  }

  return prisma.holding.update({ where: { id: holdingId }, data: { quantity } });
}

async function deleteHolding(portfolioId, userId, holdingId) {
  await getOwnedPortfolio(portfolioId, userId);

  const holding = await prisma.holding.findUnique({ where: { id: holdingId } });
  if (!holding || holding.portfolioId !== portfolioId) {
    const err = new Error('Holding not found in this portfolio');
    err.statusCode = 404;
    throw err;
  }

  return prisma.holding.delete({ where: { id: holdingId } });
}

module.exports = {
  createPortfolio,
  listPortfolios,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  getOwnedPortfolio,
};
