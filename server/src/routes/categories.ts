import { Router } from 'express';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TRANSFER_CATEGORIES } from '../config/categories.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    income: INCOME_CATEGORIES,
    expense: EXPENSE_CATEGORIES,
    transfer: TRANSFER_CATEGORIES,
  });
});

export default router;
