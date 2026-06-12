import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  let version = db.pragma('user_version', { simple: true }) as number;

  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        comment TEXT DEFAULT '',
        dayOfMonth INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        lastApplied TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS category_budgets (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        limitAmount REAL NOT NULL,
        UNIQUE(category, month, year)
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(active);
      CREATE INDEX IF NOT EXISTS idx_budgets_period ON category_budgets(year, month);
    `);
    version = 1;
  }

  if (version < 2) {
    const cols = db.prepare(`PRAGMA table_info(goals)`).all() as { name: string }[];
    if (!cols.some((c) => c.name === 'archived')) {
      db.exec(`ALTER TABLE goals ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
    }
    version = 2;
  }

  db.pragma(`user_version = ${version}`);
}
