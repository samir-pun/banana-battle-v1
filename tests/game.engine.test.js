// game.engine.test.js - tests for the game engine, using Node's built-in
// test runner. No network and no server: a fake io and a fake puzzle.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const test = require("node:test");
const assert = require("node:assert");

// Fast timings for the tests. config.js reads these when it is first loaded,
// so they must be set BEFORE the modules below are required.
process.env.SESSION_SECRET = "test-secret";
process.env.ROUND_DURATION_MS = "60";
process.env.ROUND_GAP_MS = "30";
process.env.ROUNDS_PER_GAME = "2";

const {
  rooms,
  createRoomState,
  createPlayer
} = require("../src/services/room.service");
const { createGameEngine } = require("../src/services/game.service");

function fakeIo(events) {
  return {
    to: (code) => ({
      emit: (name, data) => events.push({ code, name, data })
    })
  };
}

test("a game runs through all rounds and finishes", async () => {
  const events = [];
  const engine = createGameEngine(
    fakeIo(events),
    () => {},
    async () => ({ image: "puzzle.png", answer: "7" })
  );

  const room = createRoomState("TEST01", "s1");
  rooms.set("TEST01", room);
  room.players.set(
    "s1",
    createPlayer(
      { id: "s1", data: { userId: 1, username: "sam" } },
      "sam",
      { color: 0, eyes: 0, mouth: 0 }
    )
  );

  const socket = {
    id: "s1",
    data: { roomCode: "TEST01" },
    emit: (name, data) => events.push({ name, data })
  };

  engine.startGame(socket);
  await new Promise((resolve) => setTimeout(resolve, 400));

  assert.deepStrictEqual(
    events.map((event) => event.name),
    ["roundStarted", "roundEnded", "roundStarted", "roundEnded", "gameOver"]
  );

  // The answer must never be sent while the round is running...
  const started = events.find((event) => event.name === "roundStarted");
  assert.strictEqual(started.data.answer, undefined);
  assert.strictEqual(started.data.image, "puzzle.png");

  // ...only when it has ended.
  const ended = events.find((event) => event.name === "roundEnded");
  assert.strictEqual(ended.data.answer, "7");

  assert.strictEqual(room.state, "finished");
});

test("only the host can start the game", () => {
  const events = [];
  const engine = createGameEngine(
    fakeIo(events),
    () => {},
    async () => ({ image: "puzzle.png", answer: "7" })
  );

  const room = createRoomState("TEST02", "host");
  rooms.set("TEST02", room);

  const guest = {
    id: "guest",
    data: { roomCode: "TEST02" },
    emit: (name, data) => events.push({ name, data })
  };

  engine.startGame(guest);

  assert.strictEqual(events[0].name, "gameError");
  assert.strictEqual(room.state, "waiting");
});