// auth.js - login and register page (virtual identity).
// Sends the credentials to OUR server. The server checks them, and on
// success replies with a session cookie (httpOnly, so this script cannot
// read it). We never store the password or any token in the browser.
// Code generated with AI assistance (Claude, Anthropic), then reviewed
// and moved into this module by me.

const form = document.getElementById("authForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const authMessage = document.getElementById("authMessage");

function showMessage(text) {
  authMessage.textContent = text;
}

function setBusy(busy) {
  loginBtn.disabled = busy;
  registerBtn.disabled = busy;
}

// POST the credentials to /api/auth/login or /api/auth/register.
async function submitCredentials(endpoint, busyText) {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showMessage("Please enter a username and a password.");
    return;
  }

  setBusy(true);
  showMessage(busyText);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    // Logged in: the browser now holds the session cookie.
    window.location.href = "/";
  } catch (error) {
    showMessage(error.message);
    setBusy(false);
  }
}

// Pressing Enter submits the form, which means "Log in".
form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCredentials("/api/auth/login", "Logging in...");
});

registerBtn.addEventListener("click", () => {
  submitCredentials("/api/auth/register", "Creating your account...");
});

// If the user is already logged in, skip this page.
(async function redirectIfLoggedIn() {
  try {
    const response = await fetch("/api/auth/me");

    if (response.ok) {
      window.location.href = "/";
    }
  } catch (error) {
    // Server unreachable: stay on the login page.
  }
})();