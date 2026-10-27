// avatar.js - avatar customizer on the landing page.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const avatarState = {
  color: 0,
  eyes: 0,
  mouth: 0
};

const ATLAS_SIZE = 10;
const TOTAL_SPRITES = 100;

function setSpritePosition(element, index) {
  if (!element) return;

  const column = index % ATLAS_SIZE;
  const row = Math.floor(index / ATLAS_SIZE);

  element.style.backgroundPosition =
    `${(column / 9) * 100}% ${(row / 9) * 100}%`;
}

function renderAvatar() {
  setSpritePosition(
    document.querySelector(".avatar-color"),
    avatarState.color
  );

  setSpritePosition(
    document.querySelector(".avatar-eyes"),
    avatarState.eyes
  );

  setSpritePosition(
    document.querySelector(".avatar-mouth"),
    avatarState.mouth
  );
}

document.querySelectorAll("[data-feature][data-dir]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    const feature = button.dataset.feature;
    const direction = Number(button.dataset.dir);

    if (!Object.hasOwn(avatarState, feature)) return;

    avatarState[feature] =
      (avatarState[feature] + direction + TOTAL_SPRITES) %
      TOTAL_SPRITES;

    renderAvatar();
  });
});

document.getElementById("randomAvatarBtn")?.addEventListener(
  "click",
  (event) => {
    event.preventDefault();

    for (const feature of Object.keys(avatarState)) {
      avatarState[feature] = Math.floor(Math.random() * TOTAL_SPRITES);
    }

    renderAvatar();
  }
);

function getSelectedAvatar() {
  return { ...avatarState };
}