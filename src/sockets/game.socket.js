// game.socket.js - all Socket.IO event handling (event-driven programming).
//
// Events the server LISTENS for:  createRoom, joinRoom, disconnect
// Events the server EMITS:        roomCreated, roomJoined, playersUpdate, gameError
//
// Sockets are authenticated: only logged-in users (valid session) may connect.
//
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const { MAX_PLAYERS_PER_ROOM, ROUNDS_PER_GAME } = require("../config");
const {
  rooms,
  generateRoomCode,
  createRoomState,
  createPlayer,
  getPublicPlayers
} = require("../services/room.service");
const { getUserById } = require("../services/user.service");
const { validateNickname, validateAvatar } = require("../utils/validators");

function registerSocketHandlers(io) {
  // Send the current room state (players, ranking, round) to everyone in a room.
  function broadcastPlayers(roomCode) {
    const room = rooms.get(roomCode);

    if (!room) return;

    io.to(roomCode).emit("playersUpdate", {
      roomCode,
      hostId: room.hostId,
      state: room.state,
      round: room.round,
      totalRounds: ROUNDS_PER_GAME,
      players: getPublicPlayers(room)
    });
  }

  // Remove a player from their room; delete the room if it becomes empty.
  function removePlayer(socket) {
    const roomCode = socket.data.roomCode;

    if (!roomCode) return;

    const room = rooms.get(roomCode);
    socket.data.roomCode = null;

    if (!room) return;

    room.players.delete(socket.id);
    socket.leave(roomCode);

    console.log(`Player ${socket.id} left room ${roomCode}`);

    if (room.players.size === 0) {
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted`);
      return;
    }

    // If the host left, the next player becomes the host.
    if (room.hostId === socket.id) {
      room.hostId = room.players.keys().next().value;
    }

    broadcastPlayers(roomCode);
  }

  function createRoom(socket, data = {}) {
    const nickname = validateNickname(data.nickname);

    if (!nickname) {
      socket.emit("gameError", {
        message: "Please enter a valid nickname."
      });
      return;
    }

    removePlayer(socket);

    const roomCode = generateRoomCode();
    const room = createRoomState(roomCode, socket.id);

    rooms.set(roomCode, room);

    room.players.set(
      socket.id,
      createPlayer(socket, nickname, validateAvatar(data.avatar))
    );

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    console.log(`${nickname} created room ${roomCode}`);

    socket.emit("roomCreated", { roomCode });
    broadcastPlayers(roomCode);
  }

  function joinRoom(socket, data = {}) {
    const nickname = validateNickname(data.nickname);

    if (!nickname) {
      socket.emit("gameError", {
        message: "Please enter a valid nickname."
      });
      return;
    }

    const roomCode =
      typeof data.roomCode === "string"
        ? data.roomCode.trim().toUpperCase()
        : "";

    if (!roomCode) {
      socket.emit("gameError", {
        message: "Please enter a room code."
      });
      return;
    }

    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit("gameError", {
        message: "Room not found. Check the code and try again."
      });
      return;
    }

    if (
      socket.data.roomCode !== roomCode &&
      room.players.size >= MAX_PLAYERS_PER_ROOM
    ) {
      socket.emit("gameError", {
        message: "This room is full. Try another room."
      });
      return;
    }

    if (socket.data.roomCode === roomCode) {
      socket.emit("roomJoined", { roomCode });
      return;
    }

    removePlayer(socket);

    room.players.set(
      socket.id,
      createPlayer(socket, nickname, validateAvatar(data.avatar))
    );

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    console.log(`${nickname} joined room ${roomCode}`);

    socket.emit("roomJoined", { roomCode });
    broadcastPlayers(roomCode);
  }

  // Authentication for sockets: only logged-in users may connect.
  // This runs once, when the connection is made.
  io.use((socket, next) => {
    const userId = socket.request.session?.userId;
    const user = userId ? getUserById(userId) : null;

    if (!user) {
      return next(new Error("unauthorized"));
    }

    // Remember WHO this socket is, taken from the server-side session,
    // never from anything the browser sends.
    socket.data.userId = user.id;
    socket.data.username = user.username;
    next();
  });

  // Register the event listeners for every new connection.
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.data.username} (${socket.id})`);

    socket.on("createRoom", (data) => {
      createRoom(socket, data);
    });

    socket.on("joinRoom", (data) => {
      joinRoom(socket, data);
    });

    socket.on("disconnect", () => {
      removePlayer(socket);
      console.log("Player disconnected:", socket.id);
    });
  });
}

module.exports = { registerSocketHandlers };