import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { isValidCategory } from '../config/categories.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { scheduleInsightGeneration } from '../services/insight-jobs.js';
import { getAllTransactions } from '../services/statistics.js';
import { duplicateTransaction } from '../services/export-import.js';
import { rowToTransaction } from '../shared/mappers.js';
import { parseTransactionBody, ValidationError } from '../shared/validate.js';
import type { Transaction } from '../types/index.js';

const router = Router();

router.get(
  '/',
  asyncHandler((_req, res) => {
    res.json(getAllTransactions());
  }),
);

router.get(
  '/:id',
  asyncHandler((req, res) => {
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!row) {
      res.status(404).json({ error: 'Операция не найдена' });
      return;
    }
    res.json(rowToTransaction(row as Record<string, unknown>));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseTransactionBody(req.body);

    if (!isValidCategory(input.type, input.category)) {
      throw new ValidationError('Недопустимая категория');
    }

    const transaction: Transaction = {
      id: uuidv4(),
      type: input.type,
      amount: input.amount,
      category: input.category,
      date: input.date,
      comment: input.comment,
      createdAt: new Date().toISOString(),
    };

    db.prepare(
      `INSERT INTO transactions (id, type, amount, category, date, comment, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      transaction.id,
      transaction.type,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.comment,
      transaction.createdAt,
    );

    scheduleInsightGeneration(transaction);

    res.status(201).json({
      transaction,
      insight: null,
      insightPending: true,
    });
  }),
);

router.put(
  '/:id',
  asyncHandler((req, res) => {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Операция не найдена' });
      return;
    }

    const input = parseTransactionBody(req.body);
    if (!isValidCategory(input.type, input.category)) {
      throw new ValidationError('Недопустимая категория');
    }

    db.prepare(
      `UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, comment = ? WHERE id = ?`,
    ).run(
      input.type,
      input.amount,
      input.category,
      input.date,
      input.comment,
      req.params.id,
    );

    const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    res.json(rowToTransaction(updated as Record<string, unknown>));
  }),
);

router.post(
  '/:id/duplicate',
  asyncHandler((req, res) => {
    const copy = duplicateTransaction(String(req.params.id));
    if (!copy) {
      res.status(404).json({ error: 'Операция не найдена' });
      return;
    }
    res.status(201).json(copy);
  }),
);

router.delete(
  '/:id',
  asyncHandler((req, res) => {
    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Операция не найдена' });
      return;
    }
    res.status(204).send();
  }),
);

export default router;
