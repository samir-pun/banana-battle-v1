// config.js - central place for constants.
// Values moved from the top of the original server.js, unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

module.exports = {
  PORT: process.env.PORT || 5001,
  MAX_PLAYERS_PER_ROOM: 8,
  MAX_NICKNAME_LENGTH: 20,
  AVATAR_FEATURES: ["color", "eyes", "mouth"],
  PUZZLE_LIFETIME: 10 * 60 * 1000,

  // External Banana Game API (https://marcconrad.com/uob/banana/)
  BANANA_API_URL: "https://marcconrad.com/uob/banana/api.php?out=json",
  BANANA_API_TIMEOUT: 10000
};