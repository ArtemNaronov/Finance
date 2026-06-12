import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { rowToContribution, rowToTransaction } from '../shared/mappers.js';
import { getAllRecurring } from './recurring.js';
import { getAllSettings } from './settings.js';
import { getAllGoals } from './goals.js';
import { getAllTransactions } from './statistics.js';

const EXPORT_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: string;
  transactions: ReturnType<typeof getAllTransactions>;
  goals: ReturnType<typeof getAllGoals>;
  contributions: ReturnType<typeof rowToContribution>[];
  insights: Record<string, unknown>[];
  reports: Record<string, unknown>[];
  recurring: ReturnType<typeof getAllRecurring>;
  budgets: {
    id: string;
    category: string;
    month: number;
    year: number;
    limitAmount: number;
  }[];
  settings: Record<string, string>;
}

export function exportAllData(): ExportPayload {
  const contributions = db
    .prepare('SELECT * FROM goal_contributions ORDER BY date DESC')
    .all()
    .map((r) => rowToContribution(r as Record<string, unknown>));

  const insights = db.prepare('SELECT * FROM insights ORDER BY createdAt DESC').all() as Record<
    string,
    unknown
  >[];
  const reports = db.prepare('SELECT * FROM monthly_reports ORDER BY year DESC, month DESC').all() as Record<
    string,
    unknown
  >[];

  const budgetRows = db.prepare('SELECT * FROM category_budgets ORDER BY year DESC, month DESC').all();
  const budgets = budgetRows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      category: row.category as string,
      month: row.month as number,
      year: row.year as number,
      limitAmount: row.limitAmount as number,
    };
  });

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    transactions: getAllTransactions(),
    goals: getAllGoals(),
    contributions,
    insights,
    reports,
    recurring: getAllRecurring(),
    budgets,
    settings: getAllSettings(),
  };
}

export function importData(
  data: Partial<ExportPayload>,
  mode: 'merge' | 'replace' = 'merge',
): { imported: Record<string, number> } {
  const counts: Record<string, number> = {
    transactions: 0,
    goals: 0,
    contributions: 0,
    recurring: 0,
    budgets: 0,
    settings: 0,
  };

  const run = db.transaction(() => {
    if (mode === 'replace') {
      db.exec(`
        DELETE FROM goal_contributions;
        DELETE FROM goals;
        DELETE FROM transactions;
        DELETE FROM recurring_transactions;
        DELETE FROM category_budgets;
        DELETE FROM app_settings;
        DELETE FROM insights;
        DELETE FROM monthly_reports;
      `);
    }

    if (data.transactions) {
      const insert = db.prepare(
        `INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO transactions
         (id, type, amount, category, date, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const t of data.transactions) {
        const r = insert.run(t.id, t.type, t.amount, t.category, t.date, t.comment, t.createdAt);
        if (r.changes > 0) counts.transactions++;
      }
    }

    if (data.goals) {
      const insert = db.prepare(
        `INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO goals
         (id, name, type, targetAmount, currentAmount, monthlyPayment, interestRate, deadline, archived, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const g of data.goals) {
        const archived = (g as { archived?: boolean }).archived ? 1 : 0;
        const r = insert.run(
          g.id,
          g.name,
          g.type,
          g.targetAmount,
          g.currentAmount,
          g.monthlyPayment,
          g.interestRate,
          g.deadline ?? null,
          archived,
          g.createdAt,
        );
        if (r.changes > 0) counts.goals++;
      }
    }

    if (data.contributions) {
      const insert = db.prepare(
        `INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO goal_contributions
         (id, goalId, amount, date, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      );
      for (const c of data.contributions) {
        const r = insert.run(c.id, c.goalId, c.amount, c.date, c.comment, c.createdAt);
        if (r.changes > 0) counts.contributions++;
      }
    }

    if (data.recurring) {
      const insert = db.prepare(
        `INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO recurring_transactions
         (id, type, amount, category, comment, dayOfMonth, active, lastApplied, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const r of data.recurring) {
        const res = insert.run(
          r.id,
          r.type,
          r.amount,
          r.category,
          r.comment,
          r.dayOfMonth,
          r.active ? 1 : 0,
          r.lastApplied ?? null,
          r.createdAt,
        );
        if (res.changes > 0) counts.recurring++;
      }
    }

    if (data.budgets) {
      const insert = db.prepare(
        `INSERT OR ${mode === 'replace' ? 'REPLACE' : 'IGNORE'} INTO category_budgets
         (id, category, month, year, limitAmount) VALUES (?, ?, ?, ?, ?)`,
      );
      for (const b of data.budgets) {
        const r = insert.run(b.id, b.category, b.month, b.year, b.limitAmount);
        if (r.changes > 0) counts.budgets++;
      }
    }

    if (data.settings) {
      const insert = db.prepare(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      );
      for (const [key, value] of Object.entries(data.settings)) {
        insert.run(key, value);
        counts.settings++;
      }
    }
  });

  run();
  return { imported: counts };
}

export function parseBankCsv(content: string): {
  parsed: Omit<ReturnType<typeof rowToTransaction>, 'id' | 'createdAt'>[];
  errors: string[];
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { parsed: [], errors: ['Файл пуст или содержит только заголовок'] };
  }

  const header = lines[0].toLowerCase();
  const sep = header.includes(';') ? ';' : ',';
  const cols = lines[0].split(sep).map((c) => c.trim().toLowerCase());

  const dateIdx = cols.findIndex((c) => /дата|date/.test(c));
  const amountIdx = cols.findIndex((c) => /сумма|amount|sum/.test(c));
  const descIdx = cols.findIndex((c) => /описание|назначение|comment|description|memo/.test(c));
  const catIdx = cols.findIndex((c) => /категор|category/.test(c));
  const typeIdx = cols.findIndex((c) => /тип|type/.test(c));

  if (dateIdx < 0 || amountIdx < 0) {
    return {
      parsed: [],
      errors: ['Не найдены колонки даты и суммы. Ожидаются: дата, сумма, описание (опционально)'],
    };
  }

  const parsed: Omit<ReturnType<typeof rowToTransaction>, 'id' | 'createdAt'>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep);
    if (parts.length < 2) continue;

    const rawDate = parts[dateIdx]?.trim();
    const rawAmount = parts[amountIdx]?.trim().replace(/\s/g, '').replace(',', '.');
    const amount = Math.abs(parseFloat(rawAmount));
    if (!rawDate || isNaN(amount)) {
      errors.push(`Строка ${i + 1}: неверная дата или сумма`);
      continue;
    }

    let date = rawDate;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split('.');
      date = `${y}-${m}-${d}`;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const parsedDate = dayjs(rawDate);
      if (!parsedDate.isValid()) {
        errors.push(`Строка ${i + 1}: нераспознанная дата`);
        continue;
      }
      date = parsedDate.format('YYYY-MM-DD');
    }

    const comment = descIdx >= 0 ? parts[descIdx]?.trim() || '' : '';
    const category = catIdx >= 0 ? parts[catIdx]?.trim() || 'Прочее' : 'Прочее';
    let type: 'income' | 'expense' = 'expense';
    if (typeIdx >= 0) {
      const t = parts[typeIdx]?.trim().toLowerCase();
      type = t?.includes('доход') || t === 'income' ? 'income' : 'expense';
    } else {
      const signed = parseFloat(parts[amountIdx]?.trim().replace(/\s/g, '').replace(',', '.') ?? '0');
      type = signed >= 0 ? 'income' : 'expense';
    }

    parsed.push({ type, amount, category, date, comment });
  }

  return { parsed, errors };
}

export function importBankCsvTransactions(
  content: string,
): { created: number; errors: string[] } {
  const { parsed, errors } = parseBankCsv(content);
  let created = 0;

  const insert = db.prepare(
    `INSERT INTO transactions (id, type, amount, category, date, comment, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const run = db.transaction(() => {
    for (const t of parsed) {
      insert.run(
        uuidv4(),
        t.type,
        t.amount,
        t.category,
        t.date,
        t.comment,
        new Date().toISOString(),
      );
      created++;
    }
  });

  run();
  return { created, errors };
}

export function duplicateTransaction(id: string): ReturnType<typeof rowToTransaction> | null {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  if (!row) return null;

  const source = rowToTransaction(row as Record<string, unknown>);
  const copy = {
    ...source,
    id: uuidv4(),
    date: dayjs().format('YYYY-MM-DD'),
    createdAt: new Date().toISOString(),
    comment: source.comment ? `${source.comment} (копия)` : 'Копия операции',
  };

  db.prepare(
    `INSERT INTO transactions (id, type, amount, category, date, comment, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(copy.id, copy.type, copy.amount, copy.category, copy.date, copy.comment, copy.createdAt);

  return copy;
}
