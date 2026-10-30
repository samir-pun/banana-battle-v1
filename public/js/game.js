// game.js - the multiplayer game screen.
// Loads the layout from game.html, then draws it from events sent by the
// server (playersUpdate, and later roundStarted, roundEnded and so on).
// The browser never asks "what changed?": the server pushes updates.
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
// HEADER AND START OVERLAY
// --------------------------------------------------

function renderOverlay(data) {
  const overlay = el("gsOverlay");
  const title = el("gsOverlayTitle");
  const text = el("gsOverlayText");
  const startBtn = el("gsStartBtn");

  const waiting = data.state === "waiting" || data.state === "finished";

  overlay.hidden = !waiting;

  if (!waiting) return;

  const isHost = data.hostId === socket.id;

  title.textContent =
    data.state === "finished" ? "Game finished" : "Waiting for players";

  text.textContent = isHost
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
  } catch (error) {
    if (message) {
      message.textContent = error.message;
    }
  }
}

function leaveGame() {
  socket.emit("leaveRoom");

  if (gameScreen) {
    gameScreen.remove();
  }

  gameScreen = null;
  screenPromise = null;
  lastRoomState = null;
  currentRoomCode = null;

  if (message) {
    message.textContent = "You left the room.";
  }
}