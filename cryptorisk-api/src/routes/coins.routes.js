'use strict';

const { Router } = require('express');
const controller = require('../controllers/coins.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = Router();

router.use(requireAuth);

// GET /api/coins/:coinId/history?range=30|90|365
router.get('/:coinId/history', controller.getHistory);

module.exports = router;
