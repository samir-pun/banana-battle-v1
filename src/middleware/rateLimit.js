// rateLimit.js - slows down password guessing and mass account creation
// (virtual identity). Too many requests from one address in a time window
// get a 429 "Too Many Requests" answer.
// Note: the counters are kept in memory, so they reset when the server
// restarts, and they are per server. A real deployment with several servers
// would use a shared store such as Redis.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const rateLimit = require("express-rate-limit");
const { AUTH_WINDOW_MS, AUTH_MAX_ATTEMPTS } = require("../config");

function createLimiter(options = {}) {
  return rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: AUTH_MAX_ATTEMPTS,
    standardHeaders: "draft-7", // tells clients how many attempts are left
    legacyHeaders: false,
    message: {
      error: "Too many attempts. Please wait a few minutes and try again."
    },
    ...options
  });
}

// Failed logins count; successful ones do not, so real users are not punished.
const loginLimiter = createLimiter({ skipSuccessfulRequests: true });

// Every registration counts.
const registerLimiter = createLimiter();

module.exports = { loginLimiter, registerLimiter };