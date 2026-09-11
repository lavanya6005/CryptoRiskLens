'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const logger = require('./utils/logger');

// Routes
const authRoutes      = require('./routes/auth.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const coinsRoutes     = require('./routes/coins.routes');
const adminRoutes     = require('./routes/admin.routes');


const app = express();

// ─── FIX #4: Helmet — sets standard security headers ──────────────────────────
// Includes: X-XSS-Protection, X-Content-Type-Options, Strict-Transport-Security,
// X-Frame-Options, Content-Security-Policy, and more.
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// FRONTEND_URL is the deployed Vercel URL (set in Railway env vars).
// CLIENT_ORIGIN is the legacy local-dev fallback.
// No trailing slash — must match exactly what the browser sends as Origin.
const allowedOrigins = [
  process.env.FRONTEND_URL,   // e.g. https://cryptorisk.vercel.app
  env.CLIENT_ORIGIN,          // e.g. http://localhost:5173
].filter(Boolean);            // drop any undefined entries

app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!incomingOrigin) return callback(null, true);

    if (allowedOrigins.includes(incomingOrigin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${incomingOrigin}' is not allowed`));
  },
  credentials: true,  // required for httpOnly refresh-token cookie
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─── HTTP logging ─────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/coins',     coinsRoutes);
app.use('/api/admin',     adminRoutes);   // double-gated: requireAuth + requireAdmin


// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } })
);

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
