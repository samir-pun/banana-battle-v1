// game.js - the multiplayer game screen.
// Loads the layout from game.html, then draws it from events sent by the
// server (playersUpdate, roundStarted, roundEnded). The browser never asks
// "what changed?": the server pushes updates.
// main.js owns the socket and forwards the events to the functions below.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

// Hearts drawn per player. Keep in sync with LIVES_PER_ROUND in config.js.
const MAX_LIVES = 2;

let gameScreen = null;      // the game screen element, once it is on the page
let screenPromise = null;   // so the screen is only built once
let gameTemplate = null;    // cached text of game.html
let currentRoomCode = null;
let lastRoomState = null;   // latest playersUpdate from the server
let currentRound = null;    // latest roundStarted, while a round is running
let roundEndsAt = 0;        // when the running round ends (browser clock)
let clockTimer = null;      // updates the countdown number
let gapTimer = null;        // counts down the pause between rounds

function el(id) {
  return document.getElementById(id);
}

// --------------------------------------------------
// LOAD THE SCREEN
// --------------------------------------------------

async function buildGameScreen() {
  if (!gameTemplate) {
    const response = await fetch("game.html");

    if (!response.ok) {
      throw new Error("Could not load the game screen.");
    }

    gameTemplate = await response.text();
  }

  const doc = new DOMParser().parseFromString(gameTemplate, "text/html");
  const screen = doc.getElementById("gameScreen");

  if (!screen) {
    throw new Error("The game screen file is missing its layout.");
  }

  // game.html contains sample players and messages; remove them.
  screen.querySelector("#gsPlayers").replaceChildren();
  screen.querySelector("#gsMessages").replaceChildren();

  document.body.appendChild(screen);
  gameScreen = screen;

  el("gsLeaveBtn").addEventListener("click", leaveGame);
  el("gsStartBtn").addEventListener("click", () => {
    socket.emit("startGame");
  });

  return screen;
}

function loadGameScreen() {
  if (!screenPromise) {
    screenPromise = buildGameScreen().catch((error) => {
      screenPromise = null;
      throw error;
    });
  }

  return screenPromise;
}

// --------------------------------------------------
// DRAW THE PLAYERS
// --------------------------------------------------

// One row: rank, avatar, nickname, points and hearts.
// Text is always set with textContent (never innerHTML), so a nickname can
// never be run as HTML or script.
function buildPlayerRow(player, state) {
  const row = document.createElement("div");
  row.className = "gs-player";

  if (player.solved) row.classList.add("gs-solved");
  if (player.id === socket.id) row.classList.add("gs-you");

  if (state === "playing" && !player.solved && player.lives <= 0) {
    row.classList.add("gs-out");
  }

  const rank = document.createElement("span");
  rank.className = "gs-rank";
  rank.textContent = `#${player.rank}`;

  // The avatar is three stacked sprite layers, as on the landing page.
  const avatar = document.createElement("div");
  avatar.className = "gs-avatar";

  for (const feature of ["color", "eyes", "mouth"]) {
    const layer = document.createElement("div");
    layer.className = `avatar-layer avatar-${feature}`;
    setSpritePosition(layer, player.avatar[feature]);
    avatar.appendChild(layer);
  }

  const info = document.createElement("div");
  info.className = "gs-player-info";

  const name = document.createElement("div");
  name.className = "gs-name";
  name.textContent =
    player.id === socket.id ? `${player.nickname} (You)` : player.nickname;

  const points = document.createElement("div");
  points.className = "gs-points";
  points.textContent = `${player.score} points`;

  info.append(name, points);

  const hearts = document.createElement("div");
  hearts.className = "gs-hearts";

  for (let i = 0; i < MAX_LIVES; i++) {
    const heart = document.createElement("span");
    heart.className = "gs-heart";

    if (i >= player.lives) heart.classList.add("gs-heart-lost");

    heart.textContent = "♥";
    hearts.appendChild(heart);
  }

  row.append(rank, avatar, info, hearts);
  return row;
}

function renderPlayers(data) {
  const list = el("gsPlayers");

  list.replaceChildren();

  for (const player of data.players) {
    list.appendChild(buildPlayerRow(player, data.state));
  }
}

// --------------------------------------------------
// TIMER
// --------------------------------------------------

function stopClock() {
  clearInterval(clockTimer);
  clockTimer = null;
}

function stopGapTimer() {
  clearInterval(gapTimer);
  gapTimer = null;
}

function updateClock() {
  const secondsLeft = Math.max(
    0,
    Math.ceil((roundEndsAt - Date.now()) / 1000)
  );
  const timer = el("gsTimer");

  timer.textContent = String(secondsLeft);
  timer.classList.toggle("gs-urgent", secondsLeft <= 5);

  if (secondsLeft <= 0) stopClock();
}

function startClock() {
  stopClock();
  updateClock();
  clockTimer = setInterval(updateClock, 200);
}

// --------------------------------------------------
// PUZZLE
// --------------------------------------------------

function showPuzzle() {
  if (!gameScreen || !currentRound) return;

  const puzzle = el("gsPuzzle");

  puzzle.src = currentRound.image;
  puzzle.hidden = false;
  el("gsPlaceholder").hidden = true;
  el("gsOverlay").hidden = true;
  el("gsHint").textContent = "Solve the banana puzzle!";

  startClock();
}

function clearPuzzle() {
  el("gsPuzzle").hidden = true;
  el("gsPuzzle").removeAttribute("src");
  el("gsPlaceholder").hidden = false;
}

// Called by main.js on "roundStarted". It can arrive before the screen has
// finished loading, so it is stored and shown once the screen is ready.
function handleRoundStarted(data) {
  stopGapTimer();

  currentRound = data;
  roundEndsAt = Date.now() + data.durationMs;

  showPuzzle();
}

// Called by main.js on "roundEnded": the answer is revealed now, and a short
// countdown shows when the next round (or the final result) comes.
function handleRoundEnded(data) {
  currentRound = null;
  stopClock();
  stopGapTimer();

  if (!gameScreen) return;

  const timer = el("gsTimer");
  timer.textContent = "0";
  timer.classList.remove("gs-urgent");

  el("gsHint").textContent = "Round over";
  el("gsOverlayTitle").textContent =
    data.reason === "allDone" ? "Everyone is done!" : "Time's up!";
  el("gsStartBtn").hidden = true;
  el("gsOverlay").hidden = false;

  let secondsLeft = Math.ceil(data.gapMs / 1000);
  const nextLabel = data.isLastRound ? "Final results" : "Next round";

  function drawCountdown() {
    el("gsOverlayText").textContent =
      `The answer was ${data.answer}. ${nextLabel} in ${secondsLeft}...`;
  }

  drawCountdown();

  gapTimer = setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft <= 0) {
      stopGapTimer();
      return;
    }

    drawCountdown();
  }, 1000);
}

// --------------------------------------------------
// HEADER AND OVERLAY
// --------------------------------------------------

function renderOverlay(data) {
  const overlay = el("gsOverlay");
  const title = el("gsOverlayTitle");
  const text = el("gsOverlayText");
  const startBtn = el("gsStartBtn");

  // Between rounds, handleRoundEnded owns the overlay (answer and countdown).
  // Someone who joined during the pause still sees a message.
  if (data.state === "between") {
    if (overlay.hidden) {
      title.textContent = "Round over";
      text.textContent = "The next round starts in a moment...";
      startBtn.hidden = true;
      overlay.hidden = false;
    }

    return;
  }

  if (data.state === "playing") {
    overlay.hidden = true;
    return;
  }

  // waiting, loading or finished: no puzzle is on screen.
  stopClock();
  clearPuzzle();
  overlay.hidden = false;

  const timer = el("gsTimer");
  timer.textContent = "--";
  timer.classList.remove("gs-urgent");
  el("gsHint").textContent = "Solve the banana puzzle";

  if (data.state === "loading") {
    title.textContent = "Get ready!";
    text.textContent = "Loading the next puzzle...";
    startBtn.hidden = true;
    return;
  }

  const isHost = data.hostId === socket.id;

  if (data.state === "finished") {
    const winner = data.players[0];

    title.textContent = "Game finished!";
    text.textContent = winner
      ? `Winner: ${winner.nickname} with ${winner.score} points. `
      : "";
  } else {
    title.textContent = "Waiting for players";
    text.textContent = "";
  }

  text.textContent += isHost
    ? `Room code: ${data.roomCode}. Share it with your friends, then start.`
    : `Room code: ${data.roomCode}. Waiting for the host to start the game.`;

  startBtn.hidden = !isHost;
  startBtn.textContent = data.state === "finished" ? "Play again" : "Start game";
}

function renderRoomState(data) {
  if (!gameScreen) return;

  el("gsRoom").textContent = `Room ${data.roomCode}`;
  el("gsRound").textContent =
    data.round > 0
      ? `Round ${data.round} of ${data.totalRounds}`
      : "Waiting to start";

  renderPlayers(data);
  renderOverlay(data);
}

// Called by main.js on every "playersUpdate" event. The update can arrive
// before the screen has finished loading, so it is stored and drawn later.
function handlePlayersUpdate(data) {
  lastRoomState = data;
  renderRoomState(data);
}

// --------------------------------------------------
// ENTER AND LEAVE
// --------------------------------------------------

// Called by main.js when a room is created or joined.
async function startGame(code) {
  currentRoomCode = code;

  try {
    await loadGameScreen();

    if (lastRoomState) {
      renderRoomState(lastRoomState);
    }

    // Joined while a round was already running.
    if (currentRound) {
      showPuzzle();
    }
  } catch (error) {
    if (message) {
      message.textContent = error.message;
    }
  }
}

function leaveGame() {
  socket.emit("leaveRoom");

  stopClock();
  stopGapTimer();

  if (gameScreen) {
    gameScreen.remove();
  }

  gameScreen = null;
  screenPromise = null;
  lastRoomState = null;
  currentRound = null;
  currentRoomCode = null;

  if (message) {
    message.textContent = "You left the room.";
  }
}