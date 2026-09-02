'use strict';

const authService = require('../services/auth.service');
const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    return res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      return res.status(401).json({
        error: { message: 'No refresh token provided', code: 'UNAUTHORIZED' },
      });
    }
    const result = await authService.refresh(rawToken);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await authService.logout(rawToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { httpOnly: true, sameSite: 'strict' });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
