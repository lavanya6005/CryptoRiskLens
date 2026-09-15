'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const env = require('../config/env');

const BCRYPT_ROUNDS = 12;

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function refreshTokenExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user. Returns access + refresh tokens.
 */
async function register(name, email, password) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return issueTokens(user);
}

/**
 * Authenticate a user. Returns access + refresh tokens.
 */
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return issueTokens(user);
}

/**
 * Create a new access token from a valid refresh token.
 */
async function refresh(rawToken) {
  // Verify JWT signature/expiry first
  let payload;
  try {
    payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  // Verify token exists in DB and is not revoked
  const stored = await prisma.refreshToken.findUnique({
    where: { token: rawToken },
    include: { user: true },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    const err = new Error('Refresh token is invalid or has been revoked');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = signAccessToken({
    id: stored.user.id,
    email: stored.user.email,
  });
  return { accessToken };


}

/**
 * Revoke a refresh token (logout).
 */
async function logout(rawToken) {
  await prisma.refreshToken.updateMany({
    where: { token: rawToken },
    data: { revoked: true },
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function issueTokens(user) {
  const payload = { id: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const rawRefreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: rawRefreshToken,
      expiresAt: refreshTokenExpiresAt(),
      userId: user.id,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

module.exports = { register, login, refresh, logout };
