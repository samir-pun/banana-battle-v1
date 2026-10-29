// app.js - Express application setup: middleware and routes only.
// Moved from the original server.js, behaviour unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const express = require("express");
const path = require("path");

const { sessionMiddleware } = require("./middleware/session");
const puzzleRoutes = require("./routes/puzzle.routes");

const authRoutes = require("./routes/auth.routes");

const { rooms } = require("./services/room.service");

const { requireAuth } = require("./middleware/requireAuth");

const app = express();

// Serve the front-end files from the public folder.
// (public/ is one level above src/, hence "..")
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json({ limit: "10kb" }));

// Login sessions: adds req.session to every request.
app.use(sessionMiddleware);

// API status.
app.get("/api/status", (req, res) => {
  res.json({
    game: "Banana Battle",
    status: "online",
    rooms: rooms.size
  });
});

// Mount the puzzle routes. Inside puzzle.routes.js the paths are "/" and
// "/check", so the browser still calls /api/puzzle and /api/puzzle/check.
app.use("/api/puzzle", requireAuth, puzzleRoutes);

app.use("/api/auth", authRoutes);

module.exports = app;