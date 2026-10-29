// requireAuth.js - route protection (virtual identity).
// Put this in front of any route that only logged-in users may use.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Please log in first." });
  }

  next();
}

module.exports = { requireAuth };