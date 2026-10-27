// main.js - front-end entry point.
// Connects to the server with Socket.IO, handles the create/join room buttons
// and reacts to events sent by the server (event-driven programming).
//
// Events the client EMITS:    createRoom, joinRoom
// Events the client LISTENS:  roomCreated, roomJoined, gameError,
//                             connect, disconnect
//
// Moved from the original client.js, logic unchanged.
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
    message.textContent = `Room ${roomCode} created! Loading puzzle...`;
  }

  startGame(roomCode);
});

socket.on("roomJoined", ({ roomCode }) => {
  if (message) {
    message.textContent = `Joined room ${roomCode}! Loading puzzle...`;
  }

  startGame(roomCode);
});

socket.on("gameError", ({ message: errorMessage }) => {
  if (message) {
    message.textContent = errorMessage || "Something went wrong.";
  }
});

socket.on("connect", () => {
  console.log("Connected to Banana Battle server:", socket.id);
});

socket.on("disconnect", () => {
  if (message) {
    message.textContent = "Connection lost. Reconnecting...";
  }
});

// Render the default avatar on the landing page.
renderAvatar();