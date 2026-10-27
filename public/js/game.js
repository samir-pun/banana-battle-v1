// game.js - puzzle screen, loading puzzles from OUR server, checking answers.
// The browser never talks to the Banana API directly for the answer:
// it calls /api/puzzle and /api/puzzle/check on our own server.
// Moved from the original client.js, logic unchanged.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

let currentPuzzleId = null;
let currentRoomCode = null;
let gameScreen = null;
let puzzleLoading = false;

// --------------------------------------------------
// GAME SCREEN
// --------------------------------------------------

function createGameScreen() {
  if (gameScreen) return;

  const styles = document.createElement("style");

  styles.textContent = `
    #bananaGameScreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      overflow-y: auto;
      background: #124da5;
      color: #fff;
      font-family: Nunito, sans-serif;
      padding: 24px;
      box-sizing: border-box;
    }

    #bananaGameScreen * {
      box-sizing: border-box;
    }

    .banana-game-wrap {
      max-width: 760px;
      margin: 20px auto;
    }

    .banana-game-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .banana-game-card {
      background: #fff;
      color: #23334d;
      border: 4px solid #0b3678;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 6px 0 #082d63;
    }

    .banana-game-card h2 {
      margin-top: 0;
      text-align: center;
    }

    #bananaPuzzleImage {
      display: block;
      width: 100%;
      max-width: 480px;
      max-height: 420px;
      object-fit: contain;
      margin: 20px auto;
      background: #f4f6f9;
      border-radius: 8px;
    }

    .banana-answer-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    #bananaAnswer {
      flex: 1;
      min-width: 130px;
      padding: 12px;
      font: inherit;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
    }

    .banana-btn {
      padding: 12px 18px;
      border: 0;
      border-radius: 6px;
      background: #ffd43b;
      color: #26344b;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    .banana-btn:disabled {
      opacity: 0.6;
      cursor: wait;
    }

    .banana-secondary {
      background: #e8eef7;
    }

    #bananaFeedback {
      min-height: 28px;
      margin-top: 16px;
      font-weight: 800;
      text-align: center;
    }

    .banana-game-small {
      color: #dce9ff;
      font-size: 14px;
    }
  `;

  document.head.appendChild(styles);

  gameScreen = document.createElement("section");
  gameScreen.id = "bananaGameScreen";

  gameScreen.innerHTML = `
    <div class="banana-game-wrap">
      <div class="banana-game-top">
        <div>
          <h1 style="margin:0">🍌 Banana Battle</h1>
          <div class="banana-game-small">
            Solve the puzzle and find the answer!
          </div>
        </div>

        <button id="bananaBackBtn" class="banana-btn banana-secondary">
          Back to home
        </button>
      </div>

      <div class="banana-game-card">
        <h2>🧩 Banana Puzzle</h2>

        <p id="bananaLoading" style="text-align:center">
          Loading your puzzle...
        </p>

        <img
          id="bananaPuzzleImage"
          alt="Banana puzzle"
          hidden
        />

        <form id="bananaAnswerForm">
          <label for="bananaAnswer">
            Enter your numeric answer:
          </label>

          <div class="banana-answer-row">
            <input
              id="bananaAnswer"
              type="number"
              step="1"
              inputmode="numeric"
              placeholder="Your answer"
              required
            />

            <button
              id="bananaSubmitBtn"
              class="banana-btn"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>

        <p id="bananaFeedback" role="status" aria-live="polite"></p>

        <div style="text-align:center">
          <button
            id="bananaNextBtn"
            class="banana-btn"
            type="button"
            hidden
          >
            Next Puzzle →
          </button>
        </div>
      </div>

      <p id="bananaRoomLabel" class="banana-game-small"
         style="text-align:center;margin-top:20px"></p>
    </div>
  `;

  document.body.appendChild(gameScreen);

  document.getElementById("bananaBackBtn").addEventListener("click", () => {
    gameScreen.remove();
    gameScreen = null;
    currentPuzzleId = null;

    if (message) {
      message.textContent =
        "You left the puzzle screen. Your room may still be active.";
    }
  });

  document.getElementById("bananaAnswerForm").addEventListener(
    "submit",
    submitAnswer
  );

  document.getElementById("bananaNextBtn").addEventListener(
    "click",
    loadPuzzle
  );
}

// --------------------------------------------------
// LOAD A PUZZLE FROM OUR SERVER
// --------------------------------------------------

async function loadPuzzle() {
  if (puzzleLoading) return;

  puzzleLoading = true;
  currentPuzzleId = null;

  const loading = document.getElementById("bananaLoading");
  const image = document.getElementById("bananaPuzzleImage");
  const answer = document.getElementById("bananaAnswer");
  const submitButton = document.getElementById("bananaSubmitBtn");
  const nextButton = document.getElementById("bananaNextBtn");
  const feedback = document.getElementById("bananaFeedback");

  if (!loading || !image) {
    puzzleLoading = false;
    return;
  }

  loading.hidden = false;
  loading.textContent = "Loading your puzzle...";
  image.hidden = true;
  image.removeAttribute("src");
  answer.disabled = true;
  submitButton.disabled = true;
  nextButton.hidden = true;
  feedback.textContent = "";

  try {
    const response = await fetch("/api/puzzle");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load a puzzle.");
    }

    if (!data.puzzleId || !data.image) {
      throw new Error("The server returned incomplete puzzle data.");
    }

    currentPuzzleId = data.puzzleId;

    image.onload = () => {
      image.hidden = false;
      loading.hidden = true;
    };

    image.onerror = () => {
      image.hidden = true;
      loading.hidden = false;
      loading.textContent =
        "The puzzle image could not be displayed. Try another puzzle.";
      nextButton.hidden = false;
      currentPuzzleId = null;
    };

    image.src = data.image;

    answer.value = "";
    answer.disabled = false;
    submitButton.disabled = false;
    answer.focus();
  } catch (error) {
    loading.hidden = false;
    loading.textContent = error.message;
    feedback.textContent = "Please try loading the puzzle again.";
    nextButton.hidden = false;
  } finally {
    puzzleLoading = false;
  }
}

// --------------------------------------------------
// CHECK THE ANSWER
// --------------------------------------------------

async function submitAnswer(event) {
  event.preventDefault();

  const answerInput = document.getElementById("bananaAnswer");
  const submitButton = document.getElementById("bananaSubmitBtn");
  const nextButton = document.getElementById("bananaNextBtn");
  const feedback = document.getElementById("bananaFeedback");

  if (!currentPuzzleId) {
    feedback.textContent = "Please load a puzzle first.";
    return;
  }

  if (answerInput.value.trim() === "") {
    feedback.textContent = "Enter your answer first.";
    answerInput.focus();
    return;
  }

  submitButton.disabled = true;
  feedback.textContent = "Checking your answer...";

  try {
    const response = await fetch("/api/puzzle/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        puzzleId: currentPuzzleId,
        answer: answerInput.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not check your answer.");
    }

    feedback.textContent = data.message;

    if (data.correct) {
      feedback.style.color = "#16803c";
      currentPuzzleId = null;
      answerInput.disabled = true;
      nextButton.hidden = false;
    } else {
      feedback.style.color = "#c2410c";
      submitButton.disabled = false;
      answerInput.focus();
    }
  } catch (error) {
    feedback.textContent = error.message;
    feedback.style.color = "#c2410c";
    submitButton.disabled = false;
  }
}

// --------------------------------------------------
// START THE GAME (called by main.js when a room is created or joined)
// --------------------------------------------------

function startGame(code) {
  currentRoomCode = code;

  createGameScreen();

  document.getElementById("bananaRoomLabel").textContent =
    `Room code: ${currentRoomCode}`;

  loadPuzzle();
}