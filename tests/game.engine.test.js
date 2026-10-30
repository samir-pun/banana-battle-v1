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
const {
  createGameEngine,
  calculatePoints
} = require("../src/services/game.service");

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

// --------------------------------------------------
// Answers, lives and points
// --------------------------------------------------

// Start a round for the given players and wait until it is running.
async function setupRound(code, names) {
  const events = [];
  const engine = createGameEngine(
    fakeIo(events),
    () => {},
    async () => ({ image: "puzzle.png", answer: "7" })
  );

  const room = createRoomState(code, "s1");
  rooms.set(code, room);

  const sockets = {};

  names.forEach((name, index) => {
    const id = `s${index + 1}`;

    room.players.set(
      id,
      createPlayer(
        { id, data: { userId: index + 1, username: name } },
        name,
        { color: 0, eyes: 0, mouth: 0 }
      )
    );

    sockets[id] = {
      id,
      data: { roomCode: code },
      emit: (eventName, data) => events.push({ name: eventName, data, to: id })
    };
  });

  engine.startGame(sockets.s1);
  await new Promise((resolve) => setTimeout(resolve, 10));

  return { engine, room, sockets, events };
}

test("a correct answer scores points and the round ends when everyone has solved it", async () => {
  const { engine, room, sockets, events } = await setupRound("TEST03", [
    "sam",
    "alex"
  ]);

  engine.submitAnswer(sockets.s1, "7");

  assert.strictEqual(room.players.get("s1").solved, true);
  assert.ok(room.players.get("s1").score > 0);
  assert.strictEqual(room.state, "playing"); // alex has not answered yet
  assert.ok(events.some((event) => event.name === "playerSolved"));

  engine.submitAnswer(sockets.s2, "7");

  assert.strictEqual(room.state, "between");

  const ended = events.find((event) => event.name === "roundEnded");
  assert.strictEqual(ended.data.reason, "allDone");

  engine.stopRoom(room);
});

test("wrong answers cost lives and a player with no lives cannot guess", async () => {
  const { engine, room, sockets, events } = await setupRound("TEST04", [
    "sam",
    "alex"
  ]);

  engine.submitAnswer(sockets.s1, "1");
  assert.strictEqual(room.players.get("s1").lives, 1);

  engine.submitAnswer(sockets.s1, "2");
  assert.strictEqual(room.players.get("s1").lives, 0);

  engine.submitAnswer(sockets.s1, "7"); // the right answer, but too late

  assert.strictEqual(room.players.get("s1").solved, false);

  const last = events.filter((event) => event.to === "s1").pop();
  assert.strictEqual(last.name, "gameError");

  engine.stopRoom(room);
});

test("input that is not a number does not cost a life", async () => {
  const { engine, room, sockets, events } = await setupRound("TEST05", [
    "sam",
    "alex"
  ]);

  engine.submitAnswer(sockets.s1, "abc");

  assert.strictEqual(room.players.get("s1").lives, 2);

  const last = events.filter((event) => event.to === "s1").pop();
  assert.strictEqual(last.name, "gameError");

  engine.stopRoom(room);
});

test("faster answers score more and losing a life halves the points", () => {
  // In this test file a round lasts 60 ms (set at the top of the file).
  assert.strictEqual(calculatePoints(60, 0), 100);
  assert.strictEqual(calculatePoints(60, 1), 50);
  assert.strictEqual(calculatePoints(0, 0), 10);
});