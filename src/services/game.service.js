// game.service.js - rules and engine of the multiplayer game.
//
// A room moves through these states, driven by events and timers:
//   waiting -> loading -> playing -> between -> (next round) ... -> finished
//
// Events the engine EMITS to a room: roundStarted, roundEnded, gameOver
// (plus playersUpdate through the broadcastPlayers function it is given).
//
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const {
  ROUNDS_PER_GAME,
  ROUND_DURATION_MS,
  ROUND_GAP_MS,
  LIVES_PER_ROUND,
  MAX_POINTS_PER_ROUND,
  MIN_POINTS_PER_ROUND
} = require("../config");
const { rooms, getPublicPlayers } = require("./room.service");
const { fetchRoundPuzzle } = require("./puzzle.service");

// Points for a correct answer.
//   msLeft    - milliseconds remaining on the round timer when answered
//   livesLost - wrong guesses made before this correct answer
// Faster answers earn more points; losing a life halves the points.
function calculatePoints(msLeft, livesLost) {
  const fractionLeft = Math.min(Math.max(msLeft / ROUND_DURATION_MS, 0), 1);

  let points = Math.max(
    MIN_POINTS_PER_ROUND,
    Math.round(MAX_POINTS_PER_ROUND * fractionLeft)
  );

  if (livesLost >= 1) {
    points = Math.round(points / 2);
  }

  return points;
}

// The engine is created with the things it depends on, so a test can give it
// a fake io and a fake puzzle fetcher (dependency injection).
function createGameEngine(io, broadcastPlayers, fetchPuzzle = fetchRoundPuzzle) {
  function clearTimer(room) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
  }

  // Called when a room is deleted, so its timers do not keep running.
  function stopRoom(room) {
    clearTimer(room);
  }

  // Host starts a new game.
  function startGame(socket) {
    const room = rooms.get(socket.data.roomCode);

    if (!room) {
      socket.emit("gameError", { message: "Join a room first." });
      return;
    }

    if (room.hostId !== socket.id) {
      socket.emit("gameError", { message: "Only the host can start the game." });
      return;
    }

    if (room.state !== "waiting" && room.state !== "finished") {
      socket.emit("gameError", { message: "The game is already running." });
      return;
    }

    room.round = 0;

    for (const player of room.players.values()) {
      player.score = 0;
      player.solvedCount = 0;
    }

    startRound(room);
  }

  async function startRound(room) {
    clearTimer(room);

    room.round += 1;
    room.state = "loading";
    room.currentPuzzle = null;

    // Everyone starts the round with full lives and nothing solved.
    for (const player of room.players.values()) {
      player.lives = LIVES_PER_ROUND;
      player.solved = false;
      player.wrongGuesses = 0;
    }

    broadcastPlayers(room.code);

    let puzzle;

    try {
      puzzle = await fetchPuzzle();
    } catch (error) {
      console.error("Round puzzle error:", error.message);

      if (rooms.get(room.code) !== room) return;

      room.state = "waiting";
      room.round = 0;

      io.to(room.code).emit("gameError", {
        message:
          "Could not load a puzzle, so the game was stopped. The host can start again."
      });
      broadcastPlayers(room.code);
      return;
    }

    // The room may have been deleted while we waited for the API.
    if (rooms.get(room.code) !== room || room.state !== "loading") return;

    room.state = "playing";
    room.currentPuzzle = {
      image: puzzle.image,
      answer: puzzle.answer,   // stays on the server
      startedAt: Date.now()
    };

    room.timer = setTimeout(() => endRound(room, "timeout"), ROUND_DURATION_MS);

    // The answer is NOT in this event.
    io.to(room.code).emit("roundStarted", {
      round: room.round,
      totalRounds: ROUNDS_PER_GAME,
      image: puzzle.image,
      durationMs: ROUND_DURATION_MS
    });
    broadcastPlayers(room.code);
  }

  function endRound(room, reason) {
    if (room.state !== "playing") return;

    clearTimer(room);
    room.state = "between";

    const isLastRound = room.round >= ROUNDS_PER_GAME;

    // The answer is revealed only now that the round is over.
    io.to(room.code).emit("roundEnded", {
      round: room.round,
      answer: room.currentPuzzle.answer,
      reason,
      gapMs: ROUND_GAP_MS,
      isLastRound
    });
    broadcastPlayers(room.code);

    room.timer = setTimeout(() => {
      if (isLastRound) {
        finishGame(room);
      } else {
        startRound(room);
      }
    }, ROUND_GAP_MS);
  }

  function finishGame(room) {
    clearTimer(room);

    room.state = "finished";
    room.currentPuzzle = null;

    io.to(room.code).emit("gameOver", { players: getPublicPlayers(room) });
    broadcastPlayers(room.code);
  }

  // Someone joins while a round is running: send them the current puzzle with
  // the time that is left.
  function syncPlayer(socket, room) {
    if (room.state !== "playing" || !room.currentPuzzle) return;

    const elapsed = Date.now() - room.currentPuzzle.startedAt;

    socket.emit("roundStarted", {
      round: room.round,
      totalRounds: ROUNDS_PER_GAME,
      image: room.currentPuzzle.image,
      durationMs: Math.max(ROUND_DURATION_MS - elapsed, 0)
    });
  }

  return { startGame, syncPlayer, stopRoom, endRound };
}

module.exports = { calculatePoints, createGameEngine };