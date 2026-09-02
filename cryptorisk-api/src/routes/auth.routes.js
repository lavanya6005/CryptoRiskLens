'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

const router = Router();

const registerSchema = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login',    authLimiter, validate(loginSchema),    controller.login);
router.post('/refresh',  authLimiter, controller.refresh);
router.post('/logout',               controller.logout);

module.exports = router;
