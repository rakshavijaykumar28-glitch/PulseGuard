// src/db.js - Database module using native node:sqlite (Node 22+)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'pulseguard.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      role TEXT DEFAULT 'owner',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      type TEXT NOT NULL,
      currency TEXT DEFAULT '₹',
      health_score INTEGER DEFAULT 68,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      date TEXT NOT NULL,
      product TEXT NOT NULL,
      quantity REAL NOT NULL,
      revenue REAL NOT NULL,
      category TEXT DEFAULT 'food',
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      date TEXT NOT NULL,
      product TEXT NOT NULL,
      stock_level REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      unit_cost REAL DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      text TEXT NOT NULL,
      rating INTEGER NOT NULL,
      resolved INTEGER DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      date TEXT NOT NULL,
      supplier TEXT NOT NULL,
      expected_date TEXT NOT NULL,
      actual_date TEXT,
      delay_days REAL DEFAULT 0,
      item TEXT,
      status TEXT DEFAULT 'Delivered',
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      name TEXT NOT NULL,
      item_supplied TEXT NOT NULL,
      delivery_time REAL NOT NULL,
      reliability REAL NOT NULL,
      trend TEXT DEFAULT 'Stable',
      status TEXT DEFAULT 'Active',
      contact TEXT,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS risks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      risk_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      probability REAL NOT NULL,
      impact_min REAL NOT NULL,
      impact_max REAL NOT NULL,
      urgency TEXT NOT NULL,
      summary TEXT NOT NULL,
      days_remaining REAL,
      root_cause_json TEXT,
      cost_of_inaction_json TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS risk_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      risk_id INTEGER,
      metric_name TEXT NOT NULL,
      metric_category TEXT NOT NULL,
      change_percentage REAL NOT NULL,
      baseline_value TEXT NOT NULL,
      current_value TEXT NOT NULL,
      observation TEXT NOT NULL,
      direction TEXT NOT NULL,
      confidence REAL DEFAULT 0.85,
      FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      risk_id INTEGER,
      priority INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      expected_benefit TEXT NOT NULL,
      FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      risk_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      responsible_person TEXT DEFAULT 'Manager',
      deadline TEXT,
      status TEXT DEFAULT 'Pending',
      expected_impact TEXT,
      actual_outcome TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (risk_id) REFERENCES risks(id)
    );

    CREATE TABLE IF NOT EXISTS risk_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      risk_id INTEGER,
      date TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      probability REAL NOT NULL,
      stage TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (risk_id) REFERENCES risks(id)
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      name TEXT NOT NULL,
      demand_delta REAL DEFAULT 0,
      supplier_delay_delta REAL DEFAULT 0,
      inventory_delta REAL DEFAULT 0,
      simulated_risk_score INTEGER,
      simulated_probability REAL,
      simulated_days REAL,
      simulated_impact REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      evidence_json TEXT,
      recommendation_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      title TEXT NOT NULL,
      health_score INTEGER NOT NULL,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      report_data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      action_type TEXT NOT NULL,
      actor TEXT DEFAULT 'admin@pulseguard.ai',
      client_ip TEXT NOT NULL,
      target_entity TEXT,
      details TEXT,
      status TEXT DEFAULT 'SUCCESS'
    );
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
