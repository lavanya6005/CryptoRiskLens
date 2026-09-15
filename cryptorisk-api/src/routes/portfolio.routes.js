'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/portfolio.controller');
const analyticsController = require('../controllers/analytics.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

// All portfolio routes require authentication
router.use(requireAuth);

// Schemas
const createPortfolioSchema = z.object({ name: z.string().min(1).max(200) });
const updatePortfolioSchema = z.object({ name: z.string().min(1).max(200) });
const addHoldingSchema = z.object({
  coinId:   z.string().min(1).max(100),
  quantity: z.number().positive(),
  buyPrice: z.number().positive(),   // USD price per coin at time of purchase
});

const updateHoldingSchema = z.object({ quantity: z.number().positive() });

// Portfolio CRUD
router.post('/',    validate(createPortfolioSchema), controller.createPortfolio);
router.get('/',                                      controller.listPortfolios);
router.get('/:id', controller.getPortfolio);
router.put('/:id', validate(updatePortfolioSchema),  controller.updatePortfolio);
router.delete('/:id',                                controller.deletePortfolio);

// Holdings
router.post(  '/:id/holdings',               validate(addHoldingSchema),    controller.addHolding);
router.put(   '/:id/holdings/:holdingId',    validate(updateHoldingSchema), controller.updateHolding);
router.delete('/:id/holdings/:holdingId',                                   controller.deleteHolding);

// Analytics (scoped under portfolio)
router.get('/:id/summary',     analyticsController.getSummary);
router.get('/:id/risk',        analyticsController.getRisk);
router.get('/:id/correlation', analyticsController.getCorrelation);

module.exports = router;
