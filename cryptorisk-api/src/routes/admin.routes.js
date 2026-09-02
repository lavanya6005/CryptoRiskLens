'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/requireAdmin.middleware');
const prisma = require('../config/database');

const router = Router();

// All admin routes: must be authenticated AND must be admin
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/users
 * List all users (id, name, email, role, createdAt)
 */
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { portfolios: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/users/:id/role
 * Promote or demote a user's role.
 * Body: { role: "user" | "admin" }
 */
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: { message: 'role must be "user" or "admin"', code: 'VALIDATION_ERROR' },
      });
    }
    const updated = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (cascade removes portfolios, holdings, refresh tokens).
 * Prevents self-deletion.
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({
        error: { message: 'You cannot delete your own account', code: 'BAD_REQUEST' },
      });
    }
    await prisma.user.delete({ where: { id: targetId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/stats
 * Returns system-level stats for the admin dashboard.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalPortfolios] = await Promise.all([
      prisma.user.count(),
      prisma.portfolio.count(),
    ]);
    res.json({ totalUsers, totalPortfolios });
  } catch (err) { next(err); }
});

module.exports = router;
