// room.service.test.js - tests for room codes, players and ranking, using
// Node's built-in test runner.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const test = require("node:test");
const assert = require("node:assert");

// config.js refuses to load without a session secret.
process.env.SESSION_SECRET = "test-secret";

const {
  generateRoomCode,
  createRoomState,
  createPlayer,
  getPublicPlayers
} = require("../src/services/room.service");

const AVATAR = { color: 0, eyes: 0, mouth: 0 };

function makePlayer(id, nickname, score, solvedCount) {
  const player = createPlayer(
    { id, data: { userId: 1, username: nickname } },
    nickname,
    AVATAR
  );

  player.score = score;
  player.solvedCount = solvedCount;

  return player;
}

test("room codes have 6 characters and avoid confusing letters", () => {
  for (let i = 0; i < 100; i++) {
    assert.match(generateRoomCode(), /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  }
});

test("a new player starts with full lives and no score", () => {
  const player = createPlayer(
    { id: "s1", data: { userId: 7, username: "sam" } },
    "Sam",
    { color: 1, eyes: 2, mouth: 3 }
  );

  assert.strictEqual(player.id, "s1");
  assert.strictEqual(player.userId, 7);
  assert.strictEqual(player.username, "sam");
  assert.strictEqual(player.nickname, "Sam");
  assert.strictEqual(player.score, 0);
  assert.strictEqual(player.solvedCount, 0);
  assert.strictEqual(player.lives, 2);
  assert.strictEqual(player.solved, false);
});

test("players are ranked by score, ties broken by puzzles solved", () => {
  const room = createRoomState("RANK01", "a");

  room.players.set("a", makePlayer("a", "Ann", 50, 1));
  room.players.set("b", makePlayer("b", "Ben", 120, 2));
  room.players.set("c", makePlayer("c", "Cat", 50, 3));

  const ranked = getPublicPlayers(room);

  assert.deepStrictEqual(
    ranked.map((player) => player.nickname),
    ["Ben", "Cat", "Ann"]
  );
  assert.deepStrictEqual(
    ranked.map((player) => player.rank),
    [1, 2, 3]
  );
});

test("browsers only see public fields, never account details", () => {
  const room = createRoomState("PUBLIC1", "a");

  room.players.set("a", makePlayer("a", "Ann", 10, 1));

  const [player] = getPublicPlayers(room);

  assert.strictEqual(player.nickname, "Ann");
  assert.strictEqual(player.userId, undefined);
  assert.strictEqual(player.username, undefined);
});