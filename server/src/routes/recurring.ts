import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createRecurring,
  deleteRecurring,
  getAllRecurring,
  updateRecurring,
} from '../services/recurring.js';
import { parsePositiveAmount, parseDate, ValidationError } from '../shared/validate.js';
import type { TransactionType } from '../types/index.js';

const router = Router();

router.get(
  '/',
  asyncHandler((_req, res) => {
    res.json(getAllRecurring());
  }),
);

router.post(
  '/',
  asyncHandler((req, res) => {
    const type = req.body?.type as TransactionType;
    if (type !== 'income' && type !== 'expense') {
      throw new ValidationError('Неверный тип операции');
    }
    const amount = parsePositiveAmount(req.body?.amount);
    const category = String(req.body?.category ?? '').trim();
    if (!category) throw new ValidationError('Категория обязательна');

    const recurring = createRecurring({
      type,
      amount,
      category,
      comment: String(req.body?.comment ?? ''),
      dayOfMonth: Number(req.body?.dayOfMonth) || 1,
    });
    res.status(201).json(recurring);
  }),
);

router.put(
  '/:id',
  asyncHandler((req, res) => {
    const updated = updateRecurring(String(req.params.id), {
      type: req.body?.type,
      amount: req.body?.amount !== undefined ? parsePositiveAmount(req.body.amount) : undefined,
      category: req.body?.category,
      comment: req.body?.comment,
      dayOfMonth: req.body?.dayOfMonth !== undefined ? Number(req.body.dayOfMonth) : undefined,
      active: req.body?.active,
    });
    if (!updated) {
      res.status(404).json({ error: 'Шаблон не найден' });
      return;
    }
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    if (!deleteRecurring(String(req.params.id))) {
      res.status(404).json({ error: 'Шаблон не найден' });
      return;
    }
    res.status(204).send();
  }),
);

export default router;
