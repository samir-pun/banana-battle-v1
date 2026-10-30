// puzzle.service.js - puzzle storage and answer checking.
// The correct answer stays on the server; the client only receives
// a puzzle ID and the image URL.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const crypto = require("crypto");
const { PUZZLE_LIFETIME } = require("../config");
const { fetchBananaPuzzle } = require("./banana.service");

// In-memory storage.
const activePuzzles = new Map();

function removeExpiredPuzzles() {
  const now = Date.now();

  for (const [id, puzzle] of activePuzzles) {
    if (now >= puzzle.expiresAt) {
      activePuzzles.delete(id);
    }
  }
}

// Fetch a new puzzle and remember its answer.
// Returns only what the client is allowed to see.
async function createPuzzle() {
  removeExpiredPuzzles();

  const data = await fetchBananaPuzzle();

  const puzzleId = crypto.randomUUID();

  activePuzzles.set(puzzleId, {
    answer: String(data.solution).trim(),
    expiresAt: Date.now() + PUZZLE_LIFETIME
  });

  return { puzzleId, image: data.question };
}

// Returns null if the puzzle is missing or expired,
// otherwise { correct: true/false }.
function checkAnswer(puzzleId, answer) {
  removeExpiredPuzzles();

  const puzzle = activePuzzles.get(puzzleId);

  if (!puzzle) return null;

  const correct = String(answer).trim() === puzzle.answer;

  if (correct) {
    activePuzzles.delete(puzzleId);
  }

  return { correct };
}

// A puzzle for a multiplayer round. Unlike createPuzzle(), the answer is
// handed to the caller (the game engine), which keeps it inside the room on
// the server and never sends it to browsers.
async function fetchRoundPuzzle() {
  const data = await fetchBananaPuzzle();

  return { image: data.question, answer: String(data.solution).trim() };
}

module.exports = { createPuzzle, checkAnswer, fetchRoundPuzzle };