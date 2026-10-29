// session.js - login sessions (virtual identity).
// The browser only holds a random session ID in a cookie; the user's data
// stays on the server. Exported separately so Socket.IO can share it later.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const session = require("express-session");
const {
  SESSION_SECRET,
  SESSION_MAX_AGE,
  IS_PRODUCTION
} = require("../config");

const sessionMiddleware = session({
  name: "banana.sid",              // custom name, hides the default "connect.sid"
  secret: SESSION_SECRET,          // signs the cookie so it cannot be forged
  resave: false,                   // do not re-save unchanged sessions
  saveUninitialized: false,        // no cookie for visitors who never log in
  cookie: {
    httpOnly: true,                // JavaScript in the page cannot read the cookie
    sameSite: "lax",               // not sent on most cross-site requests (CSRF defence)
    secure: IS_PRODUCTION,         // HTTPS only when deployed
    maxAge: SESSION_MAX_AGE        // expires after 1 day
  }
  // No "store" option: sessions live in server memory (MemoryStore), so
  // they are lost when the server restarts. Fine for this project; a real
  // deployment would use a persistent store such as SQLite or Redis.
});

module.exports = { sessionMiddleware };