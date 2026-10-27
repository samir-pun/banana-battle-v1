// puzzle.routes.js - HTTP endpoints for the Banana puzzle.
//   GET  /api/puzzle        -> fetch a new puzzle
//   POST /api/puzzle/check  -> check a submitted answer
// Moved from the original server.js, behaviour unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const express = require("express");
const { createPuzzle, checkAnswer } = require("../services/puzzle.service");

const router = express.Router();

// Fetch a new puzzle.
router.get("/", async (req, res) => {
  try {
    const puzzle = await createPuzzle();

    res.set("Cache-Control", "no-store");
    res.json(puzzle);
  } catch (error) {
    console.error("Banana puzzle error:", error.message);

    res.status(502).json({
      error: "Could not load a banana puzzle. Please try again."
    });
  }
});

// Check an answer submitted by the player.
router.post("/check", (req, res) => {
  const { puzzleId, answer } = req.body || {};

  if (
    typeof puzzleId !== "string" ||
    puzzleId.length > 100 ||
    !(
      typeof answer === "string" ||
      (typeof answer === "number" && Number.isFinite(answer))
    ) ||
    !/^\d+$/.test(String(answer).trim())
  ) {
    return res.status(400).json({
      error: "Please provide a valid puzzle ID and numeric answer."
    });
  }

  const result = checkAnswer(puzzleId, answer);

  if (!result) {
    return res.status(404).json({
      error: "Puzzle expired or not found. Please load another puzzle."
    });
  }

  res.json({
    correct: result.correct,
    message: result.correct
      ? "Correct! Great job! 🍌"
      : "Not quite! Try again."
  });
});

module.exports = router;