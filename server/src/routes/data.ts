import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  exportAllData,
  importBankCsvTransactions,
  importData,
  parseBankCsv,
} from '../services/export-import.js';
import { ValidationError } from '../shared/validate.js';

const router = Router();

router.get(
  '/export',
  asyncHandler((_req, res) => {
    const data = exportAllData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.json(data);
  }),
);

router.post(
  '/import',
  asyncHandler((req, res) => {
    const mode = req.body?.mode === 'replace' ? 'replace' : 'merge';
    const data = req.body?.data;
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Неверный формат данных');
    }
    res.json(importData(data, mode));
  }),
);

router.post(
  '/import-bank-csv',
  asyncHandler((req, res) => {
    const content = String(req.body?.content ?? '');
    if (!content.trim()) throw new ValidationError('Пустой файл');
    const preview = req.body?.preview === true;
    if (preview) {
      res.json(parseBankCsv(content));
      return;
    }
    res.json(importBankCsvTransactions(content));
  }),
);

export default router;
