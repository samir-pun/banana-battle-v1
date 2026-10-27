// banana.service.js - the ONLY file that talks to the external Banana Game API
// (https://marcconrad.com/uob/banana/). Interoperability: a REST call over
// HTTP(S) that returns JSON.
// Moved from the original server.js, logic unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const { BANANA_API_URL, BANANA_API_TIMEOUT } = require("../config");

// Fetch one puzzle from the Banana API and validate its shape.
// Returns { question, solution } where question is the image URL.
async function fetchBananaPuzzle() {
  const response = await fetch(BANANA_API_URL, {
    signal: AbortSignal.timeout(BANANA_API_TIMEOUT)
  });

  if (!response.ok) {
    throw new Error(`Banana API returned status ${response.status}`);
  }

  const data = await response.json();

  if (
    typeof data.question !== "string" ||
    !data.question.trim() ||
    data.solution === undefined ||
    data.solution === null
  ) {
    throw new Error("Invalid response from Banana Game API");
  }

  return data;
}

module.exports = { fetchBananaPuzzle };