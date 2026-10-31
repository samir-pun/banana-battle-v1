// validators.test.js - tests for nickname and avatar validation, using
// Node's built-in test runner.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const test = require("node:test");
const assert = require("node:assert");

// config.js refuses to load without a session secret.
process.env.SESSION_SECRET = "test-secret";

const {
  validateNickname,
  validateAvatar
} = require("../src/utils/validators");

test("nicknames are trimmed and cut to 20 characters", () => {
  assert.strictEqual(validateNickname("  Sam  "), "Sam");
  assert.strictEqual(validateNickname("a".repeat(30)), "a".repeat(20));
});

test("empty or non-text nicknames are rejected", () => {
  assert.strictEqual(validateNickname(""), null);
  assert.strictEqual(validateNickname("     "), null);
  assert.strictEqual(validateNickname(123), null);
  assert.strictEqual(validateNickname(null), null);
  assert.strictEqual(validateNickname(undefined), null);
});

test("a valid avatar is kept as it is", () => {
  assert.deepStrictEqual(validateAvatar({ color: 5, eyes: 99, mouth: 0 }), {
    color: 5,
    eyes: 99,
    mouth: 0
  });
});

test("invalid avatar values fall back to 0", () => {
  const result = validateAvatar({ color: -1, eyes: 1.5, mouth: "3" });

  assert.deepStrictEqual(result, { color: 0, eyes: 0, mouth: 0 });
  assert.deepStrictEqual(validateAvatar({ color: 100, eyes: 7, mouth: 7 }), {
    color: 0,
    eyes: 7,
    mouth: 7
  });
});

test("a missing or malformed avatar becomes the default", () => {
  const fallback = { color: 0, eyes: 0, mouth: 0 };

  assert.deepStrictEqual(validateAvatar(null), fallback);
  assert.deepStrictEqual(validateAvatar(undefined), fallback);
  assert.deepStrictEqual(validateAvatar([]), fallback);
  assert.deepStrictEqual(validateAvatar("avatar"), fallback);
});