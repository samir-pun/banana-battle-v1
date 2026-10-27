# Banana Battle

A multiplayer puzzle game. Players pick a nickname and avatar, create or join a room, and solve banana puzzles.

Built with Node.js, Express and Socket.IO, using the external
[Banana Game API](https://marcconrad.com/uob/banana/) by Marc Conrad.

## Requirements

- Node.js 18 or newer

## Run it

```bash
npm install
npm start
```

Then open http://localhost:5001

For auto-restart while developing: `npm run dev`

## Project structure

```
src/
  server.js            start-up only: HTTP server + Socket.IO
  app.js               Express setup and route mounting
  config.js            constants (port, limits, API URL)
  routes/              HTTP endpoints (puzzle)
  services/            business logic (Banana API, puzzles, rooms)
  sockets/             Socket.IO event handlers
  utils/               validators
public/
  index.html           landing page
  css/style.css
  js/                  front-end scripts (avatar, game, main)
  image/avatar/        avatar sprite atlases
```

## How it works

- The browser asks OUR server for a puzzle (`GET /api/puzzle`).
- The server calls the Banana API, keeps the correct answer in memory, and sends the browser only a puzzle ID and the image URL.
- The browser submits an answer (`POST /api/puzzle/check`) and the server checks it, so the answer is never exposed to the client.
- Rooms are managed with Socket.IO events (`createRoom`, `joinRoom`, `disconnect`).

## Acknowledgements

- Puzzle data: Banana Game API by Marc Conrad (https://marcconrad.com/uob/banana/).
- Parts of the code were generated with AI assistance (Claude, Anthropic).
  Each source file carries a comment saying so.