import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DB_PATH
  ? path.dirname(path.resolve(process.env.DB_PATH))
  : path.join(__dirname, '../../data');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dataDir, 'finance.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    comment TEXT DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    transactionId TEXT,
    FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS monthly_reports (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    summary TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    UNIQUE(month, year)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('savings', 'credit')),
    targetAmount REAL NOT NULL,
    currentAmount REAL NOT NULL DEFAULT 0,
    monthlyPayment REAL DEFAULT 0,
    interestRate REAL DEFAULT 0,
    deadline TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goal_contributions (
    id TEXT PRIMARY KEY,
    goalId TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    comment TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions(goalId);
  CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions(date);
  CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_date ON goal_contributions(goalId, date);
  CREATE INDEX IF NOT EXISTS idx_insights_created ON insights(createdAt);
`);

runMigrations(db);

const initialDeposits = db
  .prepare(
    `SELECT gc.id, gc.goalId, gc.amount FROM goal_contributions gc
     JOIN goals g ON g.id = gc.goalId
     WHERE gc.comment = 'Начальный взнос' AND g.type = 'savings'`,
  )
  .all() as { id: string; goalId: string; amount: number }[];

if (initialDeposits.length > 0) {
  const fixBalance = db.prepare(
    `UPDATE goals SET currentAmount = MAX(0, currentAmount - ?) WHERE id = ?`,
  );
  const removeContribution = db.prepare(`DELETE FROM goal_contributions WHERE id = ?`);
  const fixAll = db.transaction(() => {
    for (const row of initialDeposits) {
      fixBalance.run(row.amount, row.goalId);
      removeContribution.run(row.id);
    }
  });
  fixAll();
}

export { dbPath, dataDir };
export default db;
