const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const home = document.getElementById("home");
const browser = document.getElementById("browser");
const frameElement = document.getElementById("sj-frame");
const frameUrl = document.getElementById("sj-frame-url");
const errorPanel = document.getElementById("error-panel");

let controller;
let frame;
let historyStack = [];
let historyIndex = -1;
let isHistoryNavigation = false;

function normalizeInput(input) {
  const value = input.trim();
  if (!value) return null;
  if (/^(https?:\/\/|about:|mailto:)/i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

function showError(message) {
  errorPanel.textContent = `Couldn't open that page: ${message}`;
  errorPanel.hidden = false;
  window.setTimeout(() => { errorPanel.hidden = true; }, 6500);
}

async function initialize() {
  if (controller && frame) return;
  controller = await initBootstrap();
  const plugins = [];
  if (window.$scramjetUtils?.HttpCachePlugin) {
    plugins.push(new $scramjetUtils.HttpCachePlugin());
  }
  if (window.$scramjetUtils?.UrlWatcherPlugin) {
    plugins.push(new $scramjetUtils.UrlWatcherPlugin((url) => {
      frameUrl.textContent = url.href || String(url);
    }));
  }
  if (window.$scramjetUtils?.CatchEscapedLinksPlugin) {
    plugins.push(new $scramjetUtils.CatchEscapedLinksPlugin((url) => {
      return new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin);
    }));
  }
  frame = controller.createFrame(frameElement, { plugins });
}

async function navigate(rawUrl, { addHistory = true } = {}) {
  const url = normalizeInput(rawUrl);
  if (!url) return;
  errorPanel.hidden = true;
  address.value = url;
  try {
    await initialize();
    home.hidden = true;
    browser.hidden = false;
    await frame.go(url);
    frameUrl.textContent = url;
    if (addHistory && !isHistoryNavigation) {
      historyStack = historyStack.slice(0, historyIndex + 1);
      historyStack.push(url);
      historyIndex = historyStack.length - 1;
    }
  } catch (error) {
    showError(error?.message || "The proxy engine could not initialize.");
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
  browser.hidden = true;
  home.hidden = false;
  address.value = "";
  address.focus();
});
document.getElementById("close-button").addEventListener("click", () => {
  browser.hidden = true;
  home.hidden = false;
});
document.getElementById("reload-button").addEventListener("click", () => {
  if (historyIndex >= 0) navigate(historyStack[historyIndex], { addHistory: false });
});
document.getElementById("back-button").addEventListener("click", () => {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  isHistoryNavigation = true;
  navigate(historyStack[historyIndex], { addHistory: false }).finally(() => { isHistoryNavigation = false; });
});
document.getElementById("forward-button").addEventListener("click", () => {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  isHistoryNavigation = true;
  navigate(historyStack[historyIndex], { addHistory: false }).finally(() => { isHistoryNavigation = false; });
});

const initialUrl = new URL(location.href).searchParams.get("goto");
if (initialUrl) {
  history.replaceState(null, "", location.pathname);
  navigate(initialUrl);
}

fetch("/health").then((response) => {
  if (!response.ok) throw new Error("Health check failed");
}).catch(() => showError("The backend health check failed."));
