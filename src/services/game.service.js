// game.service.js - rules of the multiplayer game.
// For now it only holds the scoring rule. Round and timer logic will be
// added in the next steps.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const {
  ROUND_DURATION_MS,
  MAX_POINTS_PER_ROUND,
  MIN_POINTS_PER_ROUND
} = require("../config");

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

module.exports = { calculatePoints };