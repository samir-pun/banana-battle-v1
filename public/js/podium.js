// podium.js - the final screen, shown when the game is finished.
// The ranked players come from the server (playersUpdate with state
// "finished"): sorted by score, ties broken by puzzles solved. This file
// only draws them. All text is set with textContent, never as HTML.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

// Silver on the left, gold in the middle, bronze on the right.
const PODIUM_ORDER = [2, 1, 3];

// The avatar is three stacked sprite layers, as on the landing page.
function buildPodiumAvatar(avatar) {
  const box = document.createElement("div");
  box.className = "gs-avatar gs-pod-avatar";

  for (const feature of ["color", "eyes", "mouth"]) {
    const layer = document.createElement("div");
    layer.className = `avatar-layer avatar-${feature}`;
    setSpritePosition(layer, avatar[feature]);
    box.appendChild(layer);
  }

  return box;
}

function podiumName(player) {
  return player.id === socket.id ? `${player.nickname} (You)` : player.nickname;
}

// One column of the podium: avatar on top, then the block with rank, name
// and points. The winner also gets a crown and a trophy.
function buildPodiumColumn(player) {
  const column = document.createElement("div");
  column.className = `gs-pod-col gs-pod-${player.rank}`;

  if (player.id === socket.id) column.classList.add("gs-pod-you");

  const figure = document.createElement("div");
  figure.className = "gs-pod-figure";

  if (player.rank === 1) {
    const crown = document.createElement("span");
    crown.className = "gs-pod-crown";
    crown.textContent = "👑";
    figure.appendChild(crown);
  }

  figure.appendChild(buildPodiumAvatar(player.avatar));

  if (player.rank === 1) {
    const trophy = document.createElement("span");
    trophy.className = "gs-pod-trophy";
    trophy.textContent = "🏆";
    figure.appendChild(trophy);
  }

  const block = document.createElement("div");
  block.className = "gs-pod-block";

  const rank = document.createElement("div");
  rank.className = "gs-pod-rank";
  rank.textContent = `#${player.rank}`;

  const name = document.createElement("div");
  name.className = "gs-pod-name";
  name.textContent = podiumName(player);

  const score = document.createElement("div");
  score.className = "gs-pod-score";
  score.textContent = `${player.score} points`;

  block.append(rank, name, score);
  column.append(figure, block);

  return column;
}

// Players from fourth place down: a small avatar, name and points.
function buildOtherPlayer(player) {
  const item = document.createElement("div");
  item.className = "gs-pod-other";

  if (player.id === socket.id) item.classList.add("gs-pod-you");

  const rank = document.createElement("div");
  rank.className = "gs-pod-other-rank";
  rank.textContent = `#${player.rank}`;

  const name = document.createElement("div");
  name.className = "gs-pod-other-name";
  name.textContent = podiumName(player);

  const score = document.createElement("div");
  score.textContent = `${player.score} points`;

  item.append(rank, buildPodiumAvatar(player.avatar), name, score);

  return item;
}

function renderPodium(data) {
  const panel = document.getElementById("gsPodium");

  if (!panel) return;

  panel.replaceChildren();

  const players = data.players || [];

  if (players.length === 0) {
    panel.hidden = true;
    return;
  }

  const title = document.createElement("h2");
  title.className = "gs-pod-title";

  const winner = document.createElement("span");
  winner.className = "gs-pod-winner";
  winner.textContent = podiumName(players[0]);

  title.append(winner, document.createTextNode(" is the winner!"));

  const stage = document.createElement("div");
  stage.className = "gs-pod-stage";

  for (const rank of PODIUM_ORDER) {
    const player = players.find((candidate) => candidate.rank === rank);

    if (player) stage.appendChild(buildPodiumColumn(player));
  }

  const others = document.createElement("div");
  others.className = "gs-pod-others";

  for (const player of players.filter((candidate) => candidate.rank > 3)) {
    others.appendChild(buildOtherPlayer(player));
  }

  // Only the host can start another game.
  const footer = document.createElement("div");
  footer.className = "gs-pod-footer";

  if (data.hostId === socket.id) {
    const again = document.createElement("button");

    again.type = "button";
    again.className = "gs-btn gs-btn-primary";
    again.textContent = "Play again";
    again.addEventListener("click", () => socket.emit("startGame"));

    footer.appendChild(again);
  } else {
    footer.textContent = "Waiting for the host to play again...";
  }

  panel.append(title, stage, others, footer);
  panel.hidden = false;
}

function hidePodium() {
  const panel = document.getElementById("gsPodium");

  if (!panel) return;

  panel.hidden = true;
  panel.replaceChildren();
}
