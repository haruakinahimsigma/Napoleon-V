import { normalizeInput } from "./url-utils.js";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const home = document.getElementById("home");
const browser = document.getElementById("browser");
const frameElement = document.getElementById("sj-frame");
const frameUrl = document.getElementById("sj-frame-url");
const errorPanel = document.getElementById("error-panel");
const engineStatus = document.getElementById("engine-status");
const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");

let controller;
let frame;
let historyStack = [];
let historyIndex = -1;
let navigationSequence = 0;
let errorTimer;

function setStatus(message, state = "ready") {
  engineStatus.textContent = message;
  engineStatus.dataset.state = state;
}

function updateHistoryButtons() {
  backButton.disabled = historyIndex <= 0;
  forwardButton.disabled = historyIndex < 0 || historyIndex >= historyStack.length - 1;
}

function showError(message) {
  errorPanel.textContent = message;
  errorPanel.hidden = false;
  window.clearTimeout(errorTimer);
  errorTimer = window.setTimeout(() => { errorPanel.hidden = true; }, 8000);
}

async function initialize() {
  if (controller && frame) return;
  setStatus("Starting", "loading");

  if (typeof window.initBootstrap !== "function") {
    throw new Error("Scramjet did not load. Open /bootstrap-init.js to check the deployment.");
  }

  controller = await window.initBootstrap();

  // Scramjet's service worker must be ready before createFrame/go.
  // Without this wait, the first navigation can land on a blank/404 frame.
  if (typeof controller.wait === "function") {
    await controller.wait();
  }

  const plugins = [];
  if (window.$scramjetUtils?.HttpCachePlugin) {
    plugins.push(new window.$scramjetUtils.HttpCachePlugin());
  }
  if (window.$scramjetUtils?.UrlWatcherPlugin) {
    plugins.push(new window.$scramjetUtils.UrlWatcherPlugin((url) => {
      frameUrl.textContent = url.href || String(url);
    }));
  }
  if (window.$scramjetUtils?.CatchEscapedLinksPlugin) {
    plugins.push(new window.$scramjetUtils.CatchEscapedLinksPlugin((url) => {
      return new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin);
    }));
  }

  frame = controller.createFrame(frameElement, { plugins });
  setStatus("Ready", "ready");
}

async function navigate(rawUrl, { addHistory = true } = {}) {
  const url = normalizeInput(rawUrl);
  if (!url) {
    address.focus();
    return;
  }

  const sequence = ++navigationSequence;
  errorPanel.hidden = true;
  address.value = url;
  frameUrl.textContent = url;
  setStatus("Loading", "loading");

  try {
    await initialize();
    home.hidden = true;
    browser.hidden = false;
    await frame.go(url);
    if (sequence !== navigationSequence) return;

    frameUrl.textContent = url;
    setStatus("Ready", "ready");
    if (addHistory) {
      historyStack = historyStack.slice(0, historyIndex + 1);
      historyStack.push(url);
      historyIndex = historyStack.length - 1;
    }
    updateHistoryButtons();
  } catch (error) {
    if (sequence !== navigationSequence) return;
    setStatus("Error", "error");
    showError(`Couldn't open page. ${error?.message || "Check the deployment logs and try again."}`);
    console.error("Napoleon V navigation error:", error);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  navigate(address.value);
});

document.querySelectorAll("[data-url]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.url));
});

document.getElementById("home-button").addEventListener("click", () => {
  navigationSequence += 1;
  browser.hidden = true;
  home.hidden = false;
  address.value = "";
  setStatus("Ready", "ready");
  address.focus();
});

document.getElementById("close-button").addEventListener("click", () => {
  navigationSequence += 1;
  browser.hidden = true;
  home.hidden = false;
  setStatus("Ready", "ready");
});

document.getElementById("reload-button").addEventListener("click", () => {
  if (historyIndex >= 0) navigate(historyStack[historyIndex], { addHistory: false });
});

backButton.addEventListener("click", () => {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  updateHistoryButtons();
  navigate(historyStack[historyIndex], { addHistory: false });
});

forwardButton.addEventListener("click", () => {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  updateHistoryButtons();
  navigate(historyStack[historyIndex], { addHistory: false });
});

document.addEventListener("keydown", (event) => {
  const typing = event.target instanceof HTMLElement &&
    (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    home.hidden = false;
    browser.hidden = true;
    address.focus();
    address.select();
  } else if (!typing && event.key === "Escape" && !browser.hidden) {
    browser.hidden = true;
    home.hidden = false;
  }
});

const initialUrl = new URL(location.href).searchParams.get("goto");
if (initialUrl) {
  history.replaceState(null, "", location.pathname);
  navigate(initialUrl);
} else {
  updateHistoryButtons();
}

fetch("/health")
  .then((response) => {
    if (!response.ok) throw new Error("Health check failed");
    return response.json();
  })
  .then((health) => {
    if (health.ok) setStatus("Ready", "ready");
  })
  .catch(() => {
    setStatus("Offline", "error");
    showError("The server health check failed. Check the deployment logs.");
  });