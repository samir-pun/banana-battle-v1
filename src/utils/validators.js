// validators.js - nickname and avatar validation.
// Moved from the original server.js, logic unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const { MAX_NICKNAME_LENGTH, AVATAR_FEATURES } = require("../config");

function validateNickname(value) {
  if (typeof value !== "string") return null;

  const nickname = value.trim().slice(0, MAX_NICKNAME_LENGTH);

  return nickname || null;
}

function validateAvatar(avatar) {
  if (!avatar || typeof avatar !== "object" || Array.isArray(avatar)) {
    return { color: 0, eyes: 0, mouth: 0 };
  }

  const result = {};

  for (const feature of AVATAR_FEATURES) {
    const value = avatar[feature];

    result[feature] =
      Number.isInteger(value) && value >= 0 && value <= 99
        ? value
        : 0;
  }

  return result;
}

module.exports = { validateNickname, validateAvatar };