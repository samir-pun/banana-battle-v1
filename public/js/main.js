// main.js - front-end entry point.
// Connects to the server with Socket.IO, handles the create/join room buttons
// and reacts to events sent by the server (event-driven programming).
//
// Events the client EMITS:    createRoom, joinRoom (here); startGame,
//                             submitAnswer and leaveRoom (from game.js)
// Events the client LISTENS:  roomCreated, roomJoined, playersUpdate,
//                             roundStarted, roundEnded, guessResult,
//                             playerSolved, gameError, connect,
//                             connect_error, disconnect
//
// Moved from the original client.js, logic unchanged apart from the
// login check, the connect_error handler and the game event listeners.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const socket = io();

const nickname = document.getElementById("nickname");
const roomCodeInput = document.getElementById("roomCode");
const message = document.getElementById("message");

// --------------------------------------------------
// CREATE AND JOIN ROOMS
// --------------------------------------------------

function getNickname() {
  const name = nickname?.value.trim();

  if (!name) {
    if (message) {
      message.textContent = "Please enter a nickname first.";
    }

    nickname?.focus();
    return null;
  }

  return name;
}

document.getElementById("playBtn")?.addEventListener("click", (event) => {
  event.preventDefault();

  const name = getNickname();
  if (!name) return;

  if (!socket.connected) {
    message.textContent = "Connecting to the server. Please wait...";
    return;
  }

  message.textContent = "Creating your room...";

  socket.emit("createRoom", {
    nickname: name,
    avatar: getSelectedAvatar()
  });
});

document.getElementById("joinBtn")?.addEventListener("click", (event) => {
  event.preventDefault();

  const name = getNickname();
  if (!name) return;

  const code = roomCodeInput?.value.trim().toUpperCase();

  if (!code) {
    message.textContent = "Please enter a room code.";
    roomCodeInput?.focus();
    return;
  }

  if (!socket.connected) {
    message.textContent = "Connecting to the server. Please wait...";
    return;
  }

  message.textContent = "Joining room...";

  socket.emit("joinRoom", {
    nickname: name,
    avatar: getSelectedAvatar(),
    roomCode: code
  });
});

// --------------------------------------------------
// SERVER RESPONSES
// --------------------------------------------------

socket.on("roomCreated", ({ roomCode }) => {
  if (message) {
    message.textContent = `Room ${roomCode} created!`;
  }

  startGame(roomCode);
});

socket.on("roomJoined", ({ roomCode }) => {
  if (message) {
    message.textContent = `Joined room ${roomCode}!`;
  }

  startGame(roomCode);
});

// Game events pushed by the server. The handlers live in game.js.
socket.on("playersUpdate", handlePlayersUpdate);
socket.on("roundStarted", handleRoundStarted);
socket.on("roundEnded", handleRoundEnded);
socket.on("guessResult", handleGuessResult);
socket.on("playerSolved", handlePlayerSolved);

socket.on("chatMessage", handleChatMessage);
socket.on("systemMessage", handleSystemMessage);


// Errors go to the game screen when it is open, otherwise to the landing page.
socket.on("gameError", ({ message: errorMessage }) => {
  const text = errorMessage || "Something went wrong.";

  if (gameScreen) {
    showGameError(text);
  } else if (message) {
    message.textContent = text;
  }
});

socket.on("connect", () => {
  console.log("Connected to Banana Battle server:", socket.id);
});

// The server rejected the connection because there is no login session.
socket.on("connect_error", (error) => {
  if (error.message === "unauthorized") {
    window.location.href = "/login.html";
  }
});

socket.on("disconnect", () => {
  if (message) {
    message.textContent = "Connection lost. Reconnecting...";
  }
});

// Render the default avatar on the landing page.
renderAvatar();

// --------------------------------------------------
// LOGIN CHECK (virtual identity)
// --------------------------------------------------

// Ask the server who is logged in. The answer depends on the httpOnly
// session cookie, which this script cannot read - only the server can.
// Not logged in -> go to the login page.
async function requireLogin() {
  try {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      window.location.href = "/login.html";
      return;
    }

    const user = await response.json();

    // Prefill the nickname with the account's username (can still be changed).
    nickname.value = user.username;

    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.hidden = false;

    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login.html";
    });
  } catch (error) {
    window.location.href = "/login.html";
  }
}

requireLogin();