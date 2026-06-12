import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { searchGoals, searchTransactions } from '../services/search.js';

const router = Router();

router.get(
  '/',
  asyncHandler((req, res) => {
    const q = String(req.query.q ?? '');
    const limit = Math.min(100, Number(req.query.limit) || 50);
    res.json({
      transactions: searchTransactions(q, limit),
      goals: searchGoals(q, 20),
    });
  }),
);

export default router;
