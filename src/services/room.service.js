// room.service.js - room storage, room codes and the game state of a room.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const crypto = require("crypto");
const { LIVES_PER_ROUND } = require("../config");

// In-memory storage: roomCode -> room
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

// A new, empty room. "state" moves through:
//   waiting -> playing -> between (gap after a round) -> finished
function createRoomState(code, hostId) {
  return {
    code,
    hostId,                  // socket id of the player who may start the game
    players: new Map(),      // socket id -> player
    createdAt: Date.now(),
    state: "waiting",
    round: 0,                // 0 until the first round starts
    currentPuzzle: null
  };
}

// A player inside a room. Who they are (userId, username) comes from the
// login session, not from anything the browser sent.
function createPlayer(socket, nickname, avatar) {
  return {
    id: socket.id,
    userId: socket.data.userId,
    username: socket.data.username,
    nickname,
    avatar,
    score: 0,
    roundPoints: 0,          // points earned in the current round
    solvedCount: 0,          // puzzles solved in this game (used for tie-breaks)
    lives: LIVES_PER_ROUND,  // reset at the start of every round
    solved: false            // solved the current round?
  };
}

// What browsers may see about each player, ranked by score.
// Ties are broken by the number of puzzles solved.
function getPublicPlayers(room) {
  const list = Array.from(room.players.values()).map((player) => ({
    id: player.id,
    nickname: player.nickname,
    avatar: player.avatar,
    score: player.score,
    solvedCount: player.solvedCount,
    lives: player.lives,
    solved: player.solved
  }));

  list.sort(
    (a, b) => b.score - a.score || b.solvedCount - a.solvedCount
  );

  return list.map((player, index) => ({ ...player, rank: index + 1 }));
}

module.exports = {
  rooms,
  generateRoomCode,
  createRoomState,
  createPlayer,
  getPublicPlayers
};