import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/create-user.mjs <email> <password>");
  process.exit(1);
}

// Resolve DB path from DATABASE_URL env var, falling back to the dev database
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = path.resolve(dbUrl.replace(/^file:/, ""));

const db = new Database(dbPath);

const existing = db.prepare("SELECT id FROM User WHERE email = ?").get(email);
if (existing) {
  console.error(`User ${email} already exists.`);
  process.exit(1);
}

const id = crypto.randomUUID();
const password_hash = await bcrypt.hash(password, 12);

db.prepare(
  "INSERT INTO User (id, email, password_hash, email_notifications, push_subscriptions) VALUES (?, ?, ?, 1, '[]')"
).run(id, email, password_hash);

console.log(`Created user: ${email} (${id})`);
db.close();
