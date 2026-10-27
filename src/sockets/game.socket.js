// game.socket.js - all Socket.IO event handling (event-driven programming).
//
// Events the server LISTENS for:  createRoom, joinRoom, disconnect
// Events the server EMITS:        roomCreated, roomJoined, playersUpdate, gameError
//
// Moved from the original server.js, logic unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const { MAX_PLAYERS_PER_ROOM } = require("../config");
const { rooms, generateRoomCode } = require("../services/room.service");
const { validateNickname, validateAvatar } = require("../utils/validators");

function registerSocketHandlers(io) {
  // Send the current player list to everyone in a room.
  function broadcastPlayers(roomCode) {
    const room = rooms.get(roomCode);

    if (!room) return;

    io.to(roomCode).emit("playersUpdate", {
      roomCode,
      players: Array.from(room.players.values()).map((player) => ({
        id: player.id,
        nickname: player.nickname,
        avatar: player.avatar
      }))
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

    const room = {
      code: roomCode,
      players: new Map(),
      createdAt: Date.now()
    };

    rooms.set(roomCode, room);

    room.players.set(socket.id, {
      id: socket.id,
      nickname,
      avatar: validateAvatar(data.avatar)
    });

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

    room.players.set(socket.id, {
      id: socket.id,
      nickname,
      avatar: validateAvatar(data.avatar)
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    console.log(`${nickname} joined room ${roomCode}`);

    socket.emit("roomJoined", { roomCode });
    broadcastPlayers(roomCode);
  }

  // Register the event listeners for every new connection.
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

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