import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { isValidCategory } from '../config/categories.js';
import { scheduleInsightGeneration } from './insight-jobs.js';
import type { Transaction, TransactionType } from '../types/index.js';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  comment: string;
  dayOfMonth: number;
  active: boolean;
  lastApplied?: string;
  createdAt: string;
}

function rowToRecurring(row: Record<string, unknown>): RecurringTransaction {
  return {
    id: row.id as string,
    type: row.type as TransactionType,
    amount: row.amount as number,
    category: row.category as string,
    comment: (row.comment as string) || '',
    dayOfMonth: row.dayOfMonth as number,
    active: Boolean(row.active),
    lastApplied: (row.lastApplied as string) || undefined,
    createdAt: row.createdAt as string,
  };
}

export function getAllRecurring(): RecurringTransaction[] {
  const rows = db
    .prepare('SELECT * FROM recurring_transactions ORDER BY dayOfMonth ASC, createdAt DESC')
    .all();
  return rows.map((r) => rowToRecurring(r as Record<string, unknown>));
}

export function createRecurring(data: {
  type: TransactionType;
  amount: number;
  category: string;
  comment?: string;
  dayOfMonth?: number;
}): RecurringTransaction {
  if (!isValidCategory(data.type, data.category)) {
    throw new Error('Недопустимая категория');
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  const dayOfMonth = Math.min(28, Math.max(1, data.dayOfMonth ?? 1));

  db.prepare(
    `INSERT INTO recurring_transactions (id, type, amount, category, comment, dayOfMonth, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  ).run(id, data.type, data.amount, data.category, data.comment || '', dayOfMonth, now);

  return rowToRecurring(
    db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(id) as Record<string, unknown>,
  );
}

export function updateRecurring(
  id: string,
  data: Partial<{
    type: TransactionType;
    amount: number;
    category: string;
    comment: string;
    dayOfMonth: number;
    active: boolean;
  }>,
): RecurringTransaction | null {
  const existing = db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(id);
  if (!existing) return null;

  const r = rowToRecurring(existing as Record<string, unknown>);
  const type = data.type ?? r.type;
  const category = data.category ?? r.category;
  if (!isValidCategory(type, category)) {
    throw new Error('Недопустимая категория');
  }

  db.prepare(
    `UPDATE recurring_transactions SET type = ?, amount = ?, category = ?, comment = ?, dayOfMonth = ?, active = ? WHERE id = ?`,
  ).run(
    type,
    data.amount ?? r.amount,
    category,
    data.comment ?? r.comment,
    data.dayOfMonth ?? r.dayOfMonth,
    data.active !== undefined ? (data.active ? 1 : 0) : r.active ? 1 : 0,
    id,
  );

  return rowToRecurring(
    db.prepare('SELECT * FROM recurring_transactions WHERE id = ?').get(id) as Record<string, unknown>,
  );
}

export function deleteRecurring(id: string): boolean {
  const result = db.prepare('DELETE FROM recurring_transactions WHERE id = ?').run(id);
  return result.changes > 0;
}

function createTransactionFromRecurring(r: RecurringTransaction, date: string): Transaction {
  const transaction: Transaction = {
    id: uuidv4(),
    type: r.type,
    amount: r.amount,
    category: r.category,
    date,
    comment: r.comment ? `${r.comment} (повтор)` : 'Повторяющаяся операция',
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
  return transaction;
}

export function applyDueRecurring(): number {
  const today = dayjs();
  const currentMonthKey = today.format('YYYY-MM');
  const day = today.date();
  const active = db
    .prepare('SELECT * FROM recurring_transactions WHERE active = 1')
    .all() as Record<string, unknown>[];

  let applied = 0;
  const applyOne = db.transaction((r: RecurringTransaction) => {
    const txDate = today.date(Math.min(r.dayOfMonth, today.daysInMonth())).format('YYYY-MM-DD');
    createTransactionFromRecurring(r, txDate);
    db.prepare('UPDATE recurring_transactions SET lastApplied = ? WHERE id = ?').run(
      currentMonthKey,
      r.id,
    );
    applied++;
  });

  for (const row of active) {
    const r = rowToRecurring(row);
    if (r.dayOfMonth > day) continue;
    if (r.lastApplied === currentMonthKey) continue;
    applyOne(r);
  }

  return applied;
}
