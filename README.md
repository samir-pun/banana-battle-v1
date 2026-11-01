# Banana Battle

A multiplayer puzzle game. Players log in, pick a nickname and an avatar,
create or join a room, and race to solve the same banana puzzle. Faster
answers score more points, and every wrong guess costs a life.

Built with Node.js, Express, Socket.IO and SQLite, using the external
[Banana Game API](https://marcconrad.com/uob/banana/) by Marc Conrad.

## Requirements

- Node.js 20.6 or newer (the start script uses `--env-file`)

## Run it

```bash
npm install
cp .env.example .env
```

Open `.env` and replace the value of `SESSION_SECRET` with a long random
string. One way to make one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then start the server and open http://localhost:5001

```bash
npm start
```

For auto-restart while developing: `npm run dev`

Run the automated tests with `npm test`.

## How to play

1. Create an account (or log in).
2. Choose a nickname and customise your avatar, then click **Play now** to
   create a room, or enter a friend's room code and click **Join a room**.
3. The host clicks **Start game**. Everyone gets the same puzzle.
4. Type the number you think is the answer. You have **2 lives per round**:
   a wrong guess costs one, and with none left you cannot guess until the
   next round.
5. The faster you solve it, the more points you earn. Solving after losing
   a life gives half points.
6. A round ends when the timer runs out or everyone is done. After a
   5-second pause the next round starts. The player with the most points
   after the last round wins. During each pause you see the points every
   player earned in that round, and at the end a podium shows the final
   ranking.
7. Use the chat to talk to the room. Once you have solved a puzzle, your
   messages only reach other players who have solved it, so nobody can give
   the answer away.

## Settings

Set in `.env` (see `.env.example`):

| Variable | Meaning |
|---|---|
| `PORT` | Port for the server (default 5001) |
| `SESSION_SECRET` | Secret that signs the login cookie (required) |

Optional overrides, mainly for testing: `ROUNDS_PER_GAME`,
`ROUND_DURATION_MS`, `ROUND_GAP_MS`, `AUTH_MAX_ATTEMPTS`, `AUTH_WINDOW_MS`
and `DATABASE_PATH`. The game rules and limits live in `src/config.js`.

## Project structure

```
src/
  server.js            start-up: HTTP server + Socket.IO
  app.js               Express setup and route mounting
  config.js            constants and settings
  middleware/          sessions, route protection, rate limiting
  routes/              HTTP endpoints (auth, puzzle)
  services/            logic: Banana API, puzzles, rooms, game engine, users
  sockets/             Socket.IO events
  utils/               input validation
public/
  index.html           landing page (nickname, avatar, rooms)
  login.html           log in / create account
  game.html            layout of the game screen
  css/                 style.css, game.css
  js/                  avatar.js, auth.js, game.js, results.js, podium.js, main.js
  image/avatar/        avatar sprite atlases
tests/                 automated tests (node --test)
```

## How it works

- **Interoperability:** `src/services/banana.service.js` is the only file that
  talks to the Banana API (a REST call over HTTPS that returns JSON). The
  server calls it, so the correct answer never reaches the browser until a
  round has ended.
- **Event-driven programming:** the browser and server talk through
  Socket.IO events. The server pushes updates (players, rounds, results,
  chat) instead of the browser asking for them.
- **Virtual identity:** passwords are hashed with bcrypt and stored in
  SQLite. A signed, `httpOnly` session cookie keeps you logged in. Sockets
  are authenticated with the same session, login attempts are rate limited,
  and the identity of every player comes from the session, never from the
  browser.
- **Version control:** features were built on branches and merged with
  `--no-ff`. Stable versions are tagged.

## Socket events

| Direction | Events |
|---|---|
| Browser to server | `createRoom`, `joinRoom`, `startGame`, `submitAnswer`, `chatMessage`, `leaveRoom` |
| Server to browser | `roomCreated`, `roomJoined`, `playersUpdate`, `roundStarted`, `guessResult`, `playerSolved`, `roundEnded`, `gameOver`, `chatMessage`, `systemMessage`, `gameError` |

## Limitations

- Rooms and login sessions are kept in memory, so they are lost when the
  server restarts.
- The `secure` cookie flag is only switched on when `NODE_ENV=production`
  (HTTPS).
- The puzzle answers are single digits, which is why wrong guesses cost
  lives.

## Acknowledgements

- Puzzle data: Banana Game API by Marc Conrad
  (https://marcconrad.com/uob/banana/).
- Parts of the code were generated with AI assistance (Claude, Anthropic).
  Each source file carries a comment saying so.