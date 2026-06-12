import { Router } from 'express';
import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { parseLimit } from '../shared/validate.js';
import type { Insight } from '../types/index.js';

const router = Router();

router.get(
  '/',
  asyncHandler((req, res) => {
    const limit = parseLimit(req.query.limit, 10, 100);
    const rows = db
      .prepare('SELECT * FROM insights ORDER BY createdAt DESC LIMIT ?')
      .all(limit);
    res.json(
      rows.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id as string,
          text: r.text as string,
          createdAt: r.createdAt as string,
          transactionId: (r.transactionId as string) || undefined,
        } satisfies Insight;
      }),
    );
  }),
);

export default router;
