// config.js - central place for constants.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

// The session secret signs the login cookie. It comes from the environment
// (.env file), never from the source code. Refuse to start without it.
if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Copy .env.example to .env and set a long random value."
  );
}

module.exports = {
  PORT: process.env.PORT || 5001,
  MAX_PLAYERS_PER_ROOM: 8,
  MAX_NICKNAME_LENGTH: 20,
  AVATAR_FEATURES: ["color", "eyes", "mouth"],
  PUZZLE_LIFETIME: 10 * 60 * 1000,

  // External Banana Game API (https://marcconrad.com/uob/banana/)
  BANANA_API_URL: "https://marcconrad.com/uob/banana/api.php?out=json",
  BANANA_API_TIMEOUT: 10000,

  // Login sessions
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 1 day
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  // Multiplayer game rules. The three timing values can be overridden with
  // environment variables so the tests can run in a fraction of a second.
  ROUNDS_PER_GAME: Number(process.env.ROUNDS_PER_GAME) || 5,
  ROUND_DURATION_MS: Number(process.env.ROUND_DURATION_MS) || 30 * 1000,
  ROUND_GAP_MS: Number(process.env.ROUND_GAP_MS) || 5 * 1000,
  LIVES_PER_ROUND: 2,            // a wrong guess costs one life
  MAX_POINTS_PER_ROUND: 100,     // points for solving instantly
  MIN_POINTS_PER_ROUND: 10       // points for solving at the last moment
};