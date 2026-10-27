// server.js - entry point. Start-up only: create the HTTP server,
// attach Socket.IO, register the socket events and start listening.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const { PORT } = require("./config");
const { registerSocketHandlers } = require("./sockets/game.socket");

// Socket.IO needs the raw HTTP server, not just the Express app,
// so that HTTP requests and WebSocket connections share one port.
const server = http.createServer(app);
const io = new Server(server);

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Banana Battle running at http://localhost:${PORT}`);
});