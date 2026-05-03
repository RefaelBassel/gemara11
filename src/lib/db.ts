import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function db(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  client = createClient({ url, authToken });
  return client;
}

let initialized = false;

export async function ensureSchema(): Promise<void> {
  if (initialized) return;
  const c = db();
  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'student' CHECK(role IN ('student', 'teacher')),
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        last_login TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        exam_id TEXT NOT NULL,
        sugiya_id INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        score INTEGER,
        attempts INTEGER DEFAULT 0,
        last_attempt TEXT,
        UNIQUE(user_id, exam_id, sugiya_id)
      )`,
      `CREATE TABLE IF NOT EXISTS xp_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS daily_logins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        login_date TEXT NOT NULL,
        UNIQUE(user_id, login_date)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('leaderboard_enabled', 'true')`,
    ],
    "write",
  );
  initialized = true;
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const r = await db().execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key],
  });
  return (r.rows[0]?.value as string | undefined) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, value],
  });
}
