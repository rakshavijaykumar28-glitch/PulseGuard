// db.js - Native SQLite Database Layer for PulseGuard
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const OLD_DB_PATH = path.join(DATA_DIR, 'budgetpulse.sqlite');
const DB_PATH = path.join(DATA_DIR, 'pulseguard.sqlite');
if (!fs.existsSync(DB_PATH) && fs.existsSync(OLD_DB_PATH)) {
  try {
    fs.copyFileSync(OLD_DB_PATH, DB_PATH);
  } catch (e) {}
}

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign key constraints
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    color TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    payment_method TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS monthly_budgets (
    month TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK(amount >= 0),
    PRIMARY KEY (month, category_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_tx_cat ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_budget_month ON monthly_budgets(month);
`);

// Auto-seed initial demo data if database is fresh
function seedInitialDataIfEmpty() {
  const catCount = db.prepare('SELECT count(*) as count FROM categories;').get().count;
  if (catCount > 0) return;

  console.log('[SQLite] Empty database detected. Seeding initial schema and data...');
  const sampleData = require('./public/sample-data.js');

  db.exec('BEGIN TRANSACTION;');
  try {
    const insertCat = db.prepare('INSERT INTO categories (id, name, type, color, icon) VALUES (?, ?, ?, ?, ?);');
    for (const cat of sampleData.categories) {
      insertCat.run(cat.id, cat.name, cat.type, cat.color, cat.icon);
    }

    const insertBudget = db.prepare('INSERT INTO monthly_budgets (month, category_id, amount) VALUES (?, ?, ?);');
    for (const [month, budgets] of Object.entries(sampleData.monthlyBudgets)) {
      for (const [catId, amt] of Object.entries(budgets)) {
        insertBudget.run(month, catId, amt);
      }
    }

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, date, type, category_id, description, amount, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);
    for (const t of sampleData.transactions) {
      insertTx.run(t.id, t.date, t.type, t.categoryId, t.description, t.amount, t.paymentMethod || 'Other', t.notes || '');
    }

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?);');
    insertSetting.run('currency', 'USD');
    insertSetting.run('theme', 'light');

    db.exec('COMMIT;');
    console.log('[SQLite] Seed complete. Database ready.');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[SQLite] Seed failed:', err);
  }
}

seedInitialDataIfEmpty();

// Database Operations Layer
const Database = {
  getDbPath() {
    return DB_PATH;
  },

  getStatus() {
    let stat = { size: 0 };
    try {
      stat = fs.statSync(DB_PATH);
    } catch (e) {}

    const catCount = db.prepare('SELECT count(*) as count FROM categories;').get().count;
    const txCount = db.prepare('SELECT count(*) as count FROM transactions;').get().count;
    const budgetCount = db.prepare('SELECT count(*) as count FROM monthly_budgets;').get().count;

    return {
      engine: 'SQLite 3 (node:sqlite)',
      type: 'Embedded Relational SQL',
      filePath: DB_PATH,
      fileSizeBytes: stat.size,
      tables: {
        categories: catCount,
        transactions: txCount,
        monthly_budgets: budgetCount
      },
      healthy: true,
      timestamp: new Date().toISOString()
    };
  },

  getAllData() {
    const rawCategories = db.prepare('SELECT id, name, type, color, icon FROM categories;').all();
    const rawTransactions = db.prepare(`
      SELECT id, date, type, category_id as categoryId, description, amount, payment_method as paymentMethod, notes, created_at as createdAt
      FROM transactions
      ORDER BY date DESC, created_at DESC;
    `).all();

    const rawBudgets = db.prepare('SELECT month, category_id as categoryId, amount FROM monthly_budgets;').all();
    const monthlyBudgets = {};
    for (const row of rawBudgets) {
      if (!monthlyBudgets[row.month]) monthlyBudgets[row.month] = {};
      monthlyBudgets[row.month][row.categoryId] = Number(row.amount);
    }

    const rawSettings = db.prepare('SELECT key, value FROM settings;').all();
    const settings = {};
    for (const s of rawSettings) {
      settings[s.key] = s.value;
    }

    return {
      categories: rawCategories,
      transactions: rawTransactions,
      monthlyBudgets: monthlyBudgets,
      settings: settings
    };
  },

  addTransaction(tx) {
    const id = tx.id || ('tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    const stmt = db.prepare(`
      INSERT INTO transactions (id, date, type, category_id, description, amount, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run(
      id,
      tx.date,
      tx.type,
      tx.categoryId,
      tx.description || '',
      Number(tx.amount) || 0,
      tx.paymentMethod || 'Other',
      tx.notes || ''
    );
    return { ...tx, id };
  },

  updateTransaction(id, tx) {
    const stmt = db.prepare(`
      UPDATE transactions
      SET date = ?, type = ?, category_id = ?, description = ?, amount = ?, payment_method = ?, notes = ?
      WHERE id = ?;
    `);
    stmt.run(
      tx.date,
      tx.type,
      tx.categoryId,
      tx.description || '',
      Number(tx.amount) || 0,
      tx.paymentMethod || 'Other',
      tx.notes || '',
      id
    );
    return { ...tx, id };
  },

  deleteTransaction(id) {
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?;');
    stmt.run(id);
    return { success: true, id };
  },

  upsertBudget(month, categoryId, amount) {
    const stmt = db.prepare(`
      INSERT INTO monthly_budgets (month, category_id, amount)
      VALUES (?, ?, ?)
      ON CONFLICT(month, category_id) DO UPDATE SET amount = excluded.amount;
    `);
    stmt.run(month, categoryId, Number(amount) || 0);
    return { month, categoryId, amount: Number(amount) || 0 };
  },

  batchImportTransactions(transactions, mode = 'append') {
    db.exec('BEGIN TRANSACTION;');
    try {
      if (mode === 'replace') {
        db.prepare('DELETE FROM transactions;').run();
      }

      const stmt = db.prepare(`
        INSERT INTO transactions (id, date, type, category_id, description, amount, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `);

      for (const t of transactions) {
        const id = t.id || ('tx-' + Date.now() + '-' + Math.floor(Math.random() * 10000));
        stmt.run(
          id,
          t.date,
          t.type,
          t.categoryId,
          t.description || '',
          Number(t.amount) || 0,
          t.paymentMethod || 'Other',
          t.notes || ''
        );
      }

      db.exec('COMMIT;');
      return { count: transactions.length, mode, success: true };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  resetDemoData() {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM transactions;').run();
      db.prepare('DELETE FROM monthly_budgets;').run();
      db.prepare('DELETE FROM categories;').run();

      const sampleData = require('./public/sample-data.js');

      const insertCat = db.prepare('INSERT INTO categories (id, name, type, color, icon) VALUES (?, ?, ?, ?, ?);');
      for (const cat of sampleData.categories) {
        insertCat.run(cat.id, cat.name, cat.type, cat.color, cat.icon);
      }

      const insertBudget = db.prepare('INSERT INTO monthly_budgets (month, category_id, amount) VALUES (?, ?, ?);');
      for (const [month, budgets] of Object.entries(sampleData.monthlyBudgets)) {
        for (const [catId, amt] of Object.entries(budgets)) {
          insertBudget.run(month, catId, amt);
        }
      }

      const insertTx = db.prepare(`
        INSERT INTO transactions (id, date, type, category_id, description, amount, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `);
      for (const t of sampleData.transactions) {
        insertTx.run(t.id, t.date, t.type, t.categoryId, t.description, t.amount, t.paymentMethod || 'Other', t.notes || '');
      }

      db.exec('COMMIT;');
      return { success: true };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  clearAllData() {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM transactions;').run();
      db.prepare('DELETE FROM monthly_budgets;').run();
      db.exec('COMMIT;');
      return { success: true };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  setSetting(key, value) {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now');
    `);
    stmt.run(key, String(value));
    return { key, value };
  }
};

module.exports = Database;
