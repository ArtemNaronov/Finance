import db from '../db/index.js';
import { rowToTransaction } from '../shared/mappers.js';
import type { Transaction } from '../types/index.js';

export function searchTransactions(query: string, limit = 50): Transaction[] {
  const q = query.trim();
  if (!q) return [];

  const pattern = `%${q.replace(/[%_]/g, '')}%`;
  const rows = db
    .prepare(
      `SELECT * FROM transactions
       WHERE category LIKE ? OR comment LIKE ? OR CAST(amount AS TEXT) LIKE ? OR date LIKE ?
       ORDER BY date DESC, createdAt DESC
       LIMIT ?`,
    )
    .all(pattern, pattern, pattern, pattern, limit);

  return rows.map((r) => rowToTransaction(r as Record<string, unknown>));
}

export function searchGoals(query: string, limit = 20) {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q.replace(/[%_]/g, '')}%`;
  return db
    .prepare(`SELECT * FROM goals WHERE name LIKE ? ORDER BY createdAt DESC LIMIT ?`)
    .all(pattern, limit);
}
