import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { getMonthStats } from './statistics.js';

export interface CategoryBudget {
  id: string;
  category: string;
  month: number;
  year: number;
  limitAmount: number;
}

export interface BudgetStatus extends CategoryBudget {
  spent: number;
  remaining: number;
  percentUsed: number;
  overBudget: boolean;
}

function rowToBudget(row: Record<string, unknown>): CategoryBudget {
  return {
    id: row.id as string,
    category: row.category as string,
    month: row.month as number,
    year: row.year as number,
    limitAmount: row.limitAmount as number,
  };
}

export function getBudgetsForMonth(month: number, year: number): CategoryBudget[] {
  const rows = db
    .prepare('SELECT * FROM category_budgets WHERE month = ? AND year = ? ORDER BY category')
    .all(month, year);
  return rows.map((r) => rowToBudget(r as Record<string, unknown>));
}

export function setBudget(
  category: string,
  month: number,
  year: number,
  limitAmount: number,
): CategoryBudget {
  const existing = db
    .prepare('SELECT id FROM category_budgets WHERE category = ? AND month = ? AND year = ?')
    .get(category, month, year) as { id: string } | undefined;

  if (existing) {
    db.prepare('UPDATE category_budgets SET limitAmount = ? WHERE id = ?').run(limitAmount, existing.id);
    return rowToBudget(
      db.prepare('SELECT * FROM category_budgets WHERE id = ?').get(existing.id) as Record<
        string,
        unknown
      >,
    );
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO category_budgets (id, category, month, year, limitAmount) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, category, month, year, limitAmount);

  return rowToBudget(
    db.prepare('SELECT * FROM category_budgets WHERE id = ?').get(id) as Record<string, unknown>,
  );
}

export function deleteBudget(id: string): boolean {
  const result = db.prepare('DELETE FROM category_budgets WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getBudgetStatus(month: number, year: number): BudgetStatus[] {
  const budgets = getBudgetsForMonth(month, year);
  const stats = getMonthStats(month, year);
  const spentMap = new Map(stats.byCategory.map((c) => [c.category, c.total]));

  return budgets.map((b) => {
    const spent = spentMap.get(b.category) ?? 0;
    const remaining = b.limitAmount - spent;
    const percentUsed =
      b.limitAmount > 0 ? Math.min(100, Math.round((spent / b.limitAmount) * 100)) : 0;
    return {
      ...b,
      spent,
      remaining,
      percentUsed,
      overBudget: spent > b.limitAmount,
    };
  });
}
