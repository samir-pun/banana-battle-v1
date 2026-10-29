// auth.routes.js - register, login, logout and "who am I" (virtual identity).
//   POST /api/auth/register  -> create account and log in
//   POST /api/auth/login     -> check password and log in
//   POST /api/auth/logout    -> destroy the session
//   GET  /api/auth/me        -> current user, or 401 if not logged in
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const express = require("express");
const {
  createUser,
  verifyUser,
  getUserById
} = require("../services/user.service");

const router = express.Router();

// Start a fresh session for a user. regenerate() issues a NEW session ID
// at login, which prevents "session fixation" (an attacker planting a
// known session ID before the user logs in).
function logIn(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) return reject(saveError);
        resolve();
      });
    });
  });
}

router.post("/register", async (req, res) => {
  const { username, password } = req.body || {};

  try {
    const user = await createUser(username, password);
    await logIn(req, user);

    res.status(201).json({ id: user.id, username: user.username });
  } catch (error) {
    if (error.code === "INVALID_INPUT") {
      return res.status(400).json({ error: error.message });
    }

    if (error.code === "USERNAME_TAKEN") {
      return res.status(409).json({ error: error.message });
    }

    console.error("Register error:", error.message);
    res.status(500).json({ error: "Could not create the account." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  try {
    const user = await verifyUser(username, password);

    // One generic message: never reveal whether the username or the
    // password was wrong.
    if (!user) {
      return res
        .status(401)
        .json({ error: "Incorrect username or password." });
    }

    await logIn(req, user);

    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Could not log in." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("banana.sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  const user = req.session.userId ? getUserById(req.session.userId) : null;

  if (!user) {
    return res.status(401).json({ error: "Not logged in." });
  }

  res.json({ id: user.id, username: user.username });
});

module.exports = router;