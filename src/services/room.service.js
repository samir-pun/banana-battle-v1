// room.service.js - room storage and room code generation.
// Moved from the original server.js, logic unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const crypto = require("crypto");

// In-memory storage: roomCode -> { code, players, createdAt }
const rooms = new Map();

// Generates a 6-character code using a cryptographically secure random
// number generator. Ambiguous characters (0, O, 1, I) are left out.
function generateRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code;

  do {
    code = Array.from(
      { length: 6 },
      () => characters[crypto.randomInt(characters.length)]
    ).join("");
  } while (rooms.has(code));

  return code;
}

module.exports = { rooms, generateRoomCode };