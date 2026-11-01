// results.js - the round results shown during the pause between rounds:
// every player with the points they earned in the round that just ended.
// The server sends the list (roundEnded, "results"), sorted highest first.
// All text is set with textContent, never as HTML.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

function renderRoundResults(results) {
  const list = document.getElementById("gsResults");

  if (!list) return;

  list.replaceChildren();

  for (const result of results || []) {
    const row = document.createElement("li");
    row.className = "gs-result-row";

    if (result.id === socket.id) row.classList.add("gs-result-you");

    const name = document.createElement("span");
    name.className = "gs-result-name";
    name.textContent =
      result.id === socket.id ? `${result.nickname} (You)` : result.nickname;

    const points = document.createElement("span");
    points.className = "gs-result-points";

    if (result.points <= 0) points.classList.add("gs-result-zero");

    points.textContent = `+${result.points}`;

    row.append(name, points);
    list.appendChild(row);
  }

  list.hidden = false;
}

function hideRoundResults() {
  const list = document.getElementById("gsResults");

  if (!list) return;

  list.hidden = true;
  list.replaceChildren();
}
