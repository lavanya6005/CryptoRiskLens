'use strict';

const axios = require('axios');
const env = require('../config/env');
const cache = require('./cache.service');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// ─── TTLs ────────────────────────────────────────────────────────────────────
const LIVE_PRICE_TTL = 60;          // seconds
const HISTORICAL_PRICE_TTL = 86400; // 24 hours

// ─── Axios client ─────────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: env.COINGECKO_BASE_URL,
  timeout: 10_000,
  headers: env.COINGECKO_API_KEY
    ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY }
    : {},
});

// ─── Retry with exponential backoff ──────────────────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

async function withRetry(fn, attempt = 1) {
  try {
    return await fn();
  } catch (err) {
    const status = err.response?.status;
    // Retry on 429 (rate limit) or 5xx server errors
    if ((status === 429 || (status >= 500 && status < 600)) && attempt <= MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(`CoinGecko: ${status} response, retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, attempt + 1);
    }
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch live USD prices for an array of CoinGecko coin IDs.
 * Cached in Redis for LIVE_PRICE_TTL seconds.
 *
 * @param {string[]} coinIds
 * @returns {Promise<Record<string,{usd:number, usd_24h_change:number}>>}
 */
async function getLivePrices(coinIds) {
  if (!coinIds.length) return {};

  const cacheKey = `live:${coinIds.sort().join(',')}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const data = await withRetry(() =>
    client.get('/simple/price', {
      params: {
        ids: coinIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
      },
    }).then((r) => r.data)
  );

  await cache.set(cacheKey, data, LIVE_PRICE_TTL);
  return data;
}

/**
 * Fetch daily historical prices for a single coin over a date range.
 *
 * Strategy (cheapest-first):
 *   1. Check PostgreSQL PriceSnapshot table (data persisted from prior fetches)
 *   2. Check Redis cache
 *   3. Fetch from CoinGecko and persist + cache the result
 *
 * @param {string} coinId     CoinGecko coin ID
 * @param {number} days       Number of days of history (30 | 90 | 365)
 * @returns {Promise<Array<{date: string, price: number}>>}
 */
async function getHistoricalPrices(coinId, days = 90) {
  const cacheKey = `history:${coinId}:${days}`;

  // 1. Check Redis
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // 2. Check PostgreSQL snapshots
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const snapshots = await prisma.priceSnapshot.findMany({
    where: { coinId, date: { gte: cutoff } },
    orderBy: { date: 'asc' },
  });

  if (snapshots.length >= days - 2) {
    // Enough data in DB — format and cache
    const result = snapshots.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      price: parseFloat(s.price.toString()),
    }));
    await cache.set(cacheKey, result, HISTORICAL_PRICE_TTL);
    return result;
  }

  // 3. Fetch from CoinGecko
  const raw = await withRetry(() =>
    client.get(`/coins/${coinId}/market_chart`, {
      params: { vs_currency: 'usd', days, interval: 'daily' },
    }).then((r) => r.data)
  );

  // CoinGecko returns [[timestamp_ms, price], ...]
  const prices = raw.prices.map(([ts, price]) => ({
    date: new Date(ts).toISOString().split('T')[0],
    price,
  }));

  // Persist to DB (upsert to avoid duplicates on re-fetch)
  await persistSnapshots(coinId, prices);

  await cache.set(cacheKey, prices, HISTORICAL_PRICE_TTL);
  return prices;
}

/**
 * Persist price data to the PriceSnapshot table.
 * Uses upsert to handle re-fetching the same dates gracefully.
 */
async function persistSnapshots(coinId, prices) {
  try {
    await Promise.all(
      prices.map(({ date, price }) =>
        prisma.priceSnapshot.upsert({
          where: { coinId_date: { coinId, date: new Date(date) } },
          update: { price },
          create: { coinId, date: new Date(date), price },
        })
      )
    );
  } catch (err) {
    // Non-fatal — cache will serve the data even if DB persistence fails
    logger.error(`Failed to persist price snapshots for ${coinId}: ${err.message}`);
  }
}

module.exports = { getLivePrices, getHistoricalPrices };
