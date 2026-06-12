import { Router } from 'express';
import dayjs from 'dayjs';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  deleteBudget,
  getBudgetStatus,
  getBudgetsForMonth,
  setBudget,
} from '../services/budgets.js';
import { parsePositiveAmount, ValidationError } from '../shared/validate.js';

const router = Router();

function parseMonthYear(req: { query: Record<string, unknown> }) {
  const now = dayjs();
  const month = req.query.month ? Number(req.query.month) : now.month() + 1;
  const year = req.query.year ? Number(req.query.year) : now.year();
  if (month < 1 || month > 12) throw new ValidationError('Неверный месяц');
  return { month, year };
}

router.get(
  '/',
  asyncHandler((req, res) => {
    const { month, year } = parseMonthYear(req);
    res.json(getBudgetsForMonth(month, year));
  }),
);

router.get(
  '/status',
  asyncHandler((req, res) => {
    const { month, year } = parseMonthYear(req);
    res.json(getBudgetStatus(month, year));
  }),
);

router.post(
  '/',
  asyncHandler((req, res) => {
    const { month, year } = parseMonthYear({ query: req.body ?? {} });
    const category = String(req.body?.category ?? '').trim();
    if (!category) throw new ValidationError('Категория обязательна');
    const limitAmount = parsePositiveAmount(req.body?.limitAmount);
    res.status(201).json(setBudget(category, month, year, limitAmount));
  }),
);

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    if (!deleteBudget(String(req.params.id))) {
      res.status(404).json({ error: 'Бюджет не найден' });
      return;
    }
    res.status(204).send();
  }),
);

export default router;
