// user.service.js - user accounts (virtual identity).
// Stores users in a local SQLite database. Passwords are NEVER stored in
// plain text: only a bcrypt hash is saved.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");

// Cost factor: each +1 doubles the time needed to compute (and to brute-force) a hash.
const BCRYPT_ROUNDS = 12;

// Tests set DATABASE_PATH=:memory: so they never touch the real database.
const DATABASE_PATH =
  process.env.DATABASE_PATH ||
  path.join(__dirname, "..", "..", "data", "banana.db");

if (DATABASE_PATH !== ":memory:") {
  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
}

const db = new Database(DATABASE_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepared statements: values are passed separately from the SQL text,
// which protects against SQL injection.
const insertUser = db.prepare(
  "INSERT INTO users (username, password_hash) VALUES (?, ?)"
);
const selectByUsername = db.prepare(
  "SELECT id, username, password_hash FROM users WHERE username = ?"
);
const selectById = db.prepare(
  "SELECT id, username FROM users WHERE id = ?"
);

// A fake hash used when the username does not exist, so that a failed login
// takes about as long whether or not the user exists (prevents timing leaks).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateCredentials(username, password) {
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    throw fail(
      "INVALID_INPUT",
      "Username must be 3-20 characters: letters, numbers or underscore."
    );
  }

  // bcrypt only uses the first 72 bytes of a password, so we cap it there.
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password) > 72
  ) {
    throw fail("INVALID_INPUT", "Password must be 8-72 characters long.");
  }
}

// Create a new account. Throws USERNAME_TAKEN or INVALID_INPUT.
async function createUser(username, password) {
  validateCredentials(username, password);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const info = insertUser.run(username, passwordHash);
    return { id: Number(info.lastInsertRowid), username };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw fail("USERNAME_TAKEN", "That username is already taken.");
    }
    throw error;
  }
}

// Check a login. Returns { id, username } or null (never says WHICH part was wrong).
async function verifyUser(username, password) {
  if (typeof username !== "string" || typeof password !== "string") {
    return null;
  }

  const user = selectByUsername.get(username);
  const hash = user ? user.password_hash : DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(password, hash);

  return user && passwordMatches
    ? { id: user.id, username: user.username }
    : null;
}

function getUserById(id) {
  return selectById.get(id) || null;
}

module.exports = { createUser, verifyUser, getUserById };