// user.service.test.js - tests for user accounts (virtual identity), using
// Node's built-in test runner and an in-memory database, so the real
// database is never touched.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const test = require("node:test");
const assert = require("node:assert");

// Must be set BEFORE user.service is loaded, which opens the database.
process.env.DATABASE_PATH = ":memory:";

const {
  createUser,
  verifyUser,
  getUserById
} = require("../src/services/user.service");

test("creating an account returns the id and username only", async () => {
  const user = await createUser("sam_1", "password123");

  assert.strictEqual(user.username, "sam_1");
  assert.strictEqual(typeof user.id, "number");
  assert.strictEqual(user.password, undefined);
  assert.strictEqual(user.password_hash, undefined);
});

test("a username can only be used once, ignoring upper and lower case", async () => {
  await createUser("alex", "password123");

  await assert.rejects(
    () => createUser("ALEX", "different-password"),
    (error) => error.code === "USERNAME_TAKEN"
  );
});

test("invalid usernames and passwords are rejected", async () => {
  const invalid = (error) => error.code === "INVALID_INPUT";

  await assert.rejects(() => createUser("ab", "password123"), invalid);
  await assert.rejects(() => createUser("has space", "password123"), invalid);
  await assert.rejects(() => createUser("a".repeat(21), "password123"), invalid);
  await assert.rejects(() => createUser("validname", "short"), invalid);
  await assert.rejects(
    () => createUser("validname", "x".repeat(73)),
    invalid
  );
  await assert.rejects(() => createUser(123, "password123"), invalid);
});

test("logging in works only with the right username and password", async () => {
  await createUser("login_user", "correct-password");

  const ok = await verifyUser("login_user", "correct-password");
  assert.strictEqual(ok.username, "login_user");

  assert.strictEqual(await verifyUser("login_user", "wrong-password"), null);
  assert.strictEqual(await verifyUser("nobody", "correct-password"), null);
  assert.strictEqual(await verifyUser(null, "correct-password"), null);
  assert.strictEqual(await verifyUser("login_user", 12345678), null);
});

test("looking up a user by id never returns the password hash", async () => {
  const created = await createUser("lookup_user", "password123");
  const found = getUserById(created.id);

  assert.deepStrictEqual(found, {
    id: created.id,
    username: "lookup_user"
  });
  assert.strictEqual(getUserById(999999), null);
});