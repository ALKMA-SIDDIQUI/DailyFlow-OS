import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'dailyflow.db');

let globalDb: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!globalDb) {
    globalDb = new DatabaseSync(dbPath);
    globalDb.exec('PRAGMA journal_mode = WAL');
    globalDb.exec('PRAGMA foreign_keys = ON');
    initTables(globalDb);
  }
  return globalDb;
}

export function generateId(): string {
  return crypto.randomUUID();
}

function initTables(db: DatabaseSync) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Personal',
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'PENDING',
      due_date TEXT,
      deadline_time TEXT,
      reminder_offset INTEGER DEFAULT 30,
      is_random_eligible INTEGER DEFAULT 1,
      completed_at TEXT,
      deadline_reminder_sent INTEGER DEFAULT 0,
      deadline_expired_sent INTEGER DEFAULT 0,
      challenge_id TEXT,
      challenge_day_num INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL
    );
  `);

  // Challenges table
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Personal',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      target_days INTEGER NOT NULL DEFAULT 21,
      current_day INTEGER NOT NULL DEFAULT 1,
      completed_days_count INTEGER NOT NULL DEFAULT 0,
      missed_days_count INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Challenge Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenge_logs (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      date_str TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      task_id TEXT,
      completed_at TEXT,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Indices for rapid query performance & user data isolation
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_challenges_user_status ON challenges(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_challenge_logs_challenge ON challenge_logs(challenge_id);
    CREATE INDEX IF NOT EXISTS idx_challenge_logs_user_date ON challenge_logs(user_id, date_str);
  `);
}

// Ensure public/uploads/avatars directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
