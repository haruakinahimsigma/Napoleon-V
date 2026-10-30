/*
 * Navigation/tab workflow is an original adaptation inspired by Interstellar's
 * multi-tab browser experience. Interstellar: https://github.com/UseInterstellar/Interstellar
 * Scramjet integration adapted from the official starter:
 * https://github.com/MercuryWorkshop/scramjet/tree/main/packages/create-proxy-app/templates/default
 */
import { normalizeInput } from "./url-utils.js";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const home = document.getElementById("home");
const browser = document.getElementById("browser");
const frameShell = document.getElementById("frame-shell");
const frameUrl = document.getElementById("sj-frame-url");
const errorPanel = document.getElementById("error-panel");
const engineStatus = document.getElementById("engine-status");
const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const tabStrip = document.getElementById("tab-strip");

let controller;
let tabs = [];
let activeTabId = null;
let tabSequence = 0;
let navigationSequence = 0;
let errorTimer;

function setStatus(message, state = "ready") {
  engineStatus.textContent = message;
  engineStatus.dataset.state = state;
}

function activeTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function updateHistoryButtons() {
  const tab = activeTab();
  backButton.disabled = !tab || tab.historyIndex <= 0;
  forwardButton.disabled = !tab || tab.historyIndex >= tab.history.length - 1;
}

function showError(message) {
  errorPanel.textContent = message;
  errorPanel.hidden = false;
  window.clearTimeout(errorTimer);
  errorTimer = window.setTimeout(() => { errorPanel.hidden = true; }, 8000);
}

function tabLabel(tab) {
  if (!tab.url) return "New Tab";
  try { return new URL(tab.url).hostname.replace(/^www\./, ""); }
  catch { return tab.url.slice(0, 24); }
}

function renderTabs() {
  tabStrip.replaceChildren();
  for (const tab of tabs) {
    const item = document.createElement("div");
    item.className = "tab-item" + (tab.id === activeTabId ? " active" : "");
    item.title = tab.url || "New Tab";
    const select = document.createElement("button");
    select.className = "tab-select";
    select.type = "button";
    select.textContent = tabLabel(tab);
    select.addEventListener("click", () => activateTab(tab.id));
    const close = document.createElement("button");
    close.className = "tab-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close tab");
    close.textContent = "×";
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });
    item.append(select, close);
    tabStrip.append(item);
  }
}

async function initializeController() {
  if (controller) return;
  setStatus("Starting", "loading");
  if (typeof window.initBootstrap !== "function") {
    throw new Error("Scramjet did not load. Open /bootstrap-init.js to check the deployment.");
  }
  controller = await window.initBootstrap();
  if (typeof controller.wait === "function") await controller.wait();
}

function makeFrame(tab) {
  const iframe = document.createElement("iframe");
  iframe.title = "Proxied website";
  iframe.referrerPolicy = "no-referrer";
  iframe.className = "tab-frame";
  iframe.hidden = true;
  frameShell.append(iframe);
  tab.iframe = iframe;
  const plugins = [];
  if (window.$scramjetUtils?.HttpCachePlugin) plugins.push(new window.$scramjetUtils.HttpCachePlugin());
  if (window.$scramjetUtils?.UrlWatcherPlugin) {
    plugins.push(new window.$scramjetUtils.UrlWatcherPlugin((url) => {
      if (activeTabId === tab.id) frameUrl.textContent = url.href || String(url);
    }));
  }
  if (window.$scramjetUtils?.CatchEscapedLinksPlugin) {
    plugins.push(new window.$scramjetUtils.CatchEscapedLinksPlugin((url) =>
      new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin)));
  }
  tab.frame = controller.createFrame(iframe, { plugins });
}

async function activateTab(id) {
  activeTabId = id;
  for (const tab of tabs) tab.iframe.hidden = tab.id !== id;
  const tab = activeTab();
  renderTabs();
  browser.hidden = false;
  home.hidden = true;
  address.value = tab?.url || "";
  frameUrl.textContent = tab?.url || "New Tab";
  updateHistoryButtons();
  setStatus("Ready", "ready");
}

async function createTab(url = "") {
  const tab = { id: ++tabSequence, url: "", history: [], historyIndex: -1, iframe: null, frame: null };
  tabs.push(tab);
  try {
    await initializeController();
    makeFrame(tab);
    await activateTab(tab.id);
    if (url) await navigate(url);
  } catch (error) {
    tabs = tabs.filter((item) => item.id !== tab.id);
    renderTabs();
    setStatus("Error", "error");
    showError(`Couldn't start a new tab. ${error?.message || "Check the deployment logs."}`);
  }
}

function closeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index < 0) return;
  const [tab] = tabs.splice(index, 1);
  tab.iframe?.remove();
  if (!tabs.length) {
    activeTabId = null;
    browser.hidden = true;
    home.hidden = false;
    address.value = "";
  } else if (activeTabId === id) {
    const next = tabs[Math.min(index, tabs.length - 1)];
    activateTab(next.id);
  } else {
    renderTabs();
  }
  updateHistoryButtons();
}

async function navigate(rawUrl, { addHistory = true } = {}) {
  const url = normalizeInput(rawUrl);
  if (!url) { address.focus(); return; }
  const sequence = ++navigationSequence;
  errorPanel.hidden = true;
  address.value = url;
  frameUrl.textContent = url;
  setStatus("Loading", "loading");
  try {
    if (!controller) await initializeController();
    let tab = activeTab();
    if (!tab) {
      await createTab();
      tab = activeTab();
    }
    if (!tab.frame) makeFrame(tab);
    home.hidden = true;
    browser.hidden = false;
    await tab.frame.go(url);
    if (sequence !== navigationSequence) return;
    tab.url = url;
    frameUrl.textContent = url;
    if (addHistory) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
    }
    renderTabs();
    updateHistoryButtons();
    setStatus("Ready", "ready");
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

document.getElementById("new-tab-button").addEventListener("click", () => createTab());

document.getElementById("home-button").addEventListener("click", () => {
  navigationSequence += 1;
  browser.hidden = true;
  home.hidden = false;
  address.value = "";
  setStatus("Ready", "ready");
  address.focus();
});

document.getElementById("close-button").addEventListener("click", () => {
  const tab = activeTab();
  if (tab) closeTab(tab.id);
  else { browser.hidden = true; home.hidden = false; }
});

document.getElementById("reload-button").addEventListener("click", () => {
  const tab = activeTab();
  if (tab?.url) navigate(tab.url, { addHistory: false });
});

backButton.addEventListener("click", () => {
  const tab = activeTab();
  if (!tab || tab.historyIndex <= 0) return;
  tab.historyIndex -= 1;
  const url = tab.history[tab.historyIndex];
  updateHistoryButtons();
  navigate(url, { addHistory: false });
});

forwardButton.addEventListener("click", () => {
  const tab = activeTab();
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;
  tab.historyIndex += 1;
  const url = tab.history[tab.historyIndex];
  updateHistoryButtons();
  navigate(url, { addHistory: false });
});

document.getElementById("theme-button").addEventListener("click", () => {
  const light = document.documentElement.dataset.theme !== "light";
  document.documentElement.dataset.theme = light ? "light" : "dark";
  localStorage.setItem("napoleon-theme", light ? "light" : "dark");
  document.getElementById("theme-button").textContent = light ? "☾" : "☼";
});
const savedTheme = localStorage.getItem("napoleon-theme");
if (savedTheme === "light") {
  document.documentElement.dataset.theme = "light";
  document.getElementById("theme-button").textContent = "☾";
}

document.addEventListener("keydown", (event) => {
  const typing = event.target instanceof HTMLElement &&
    (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    home.hidden = false;
    browser.hidden = true;
    address.focus();
    address.select();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
    event.preventDefault();
    createTab();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "w" && activeTab()) {
    event.preventDefault();
    closeTab(activeTabId);
  } else if (!typing && event.key === "Escape" && !browser.hidden) {
    browser.hidden = true;
    home.hidden = false;
  }
});

const initialUrl = new URL(location.href).searchParams.get("goto");
if (initialUrl) {
  history.replaceState(null, "", location.pathname);
  createTab(initialUrl);
} else {
  updateHistoryButtons();
}

fetch("/health")
  .then((response) => {
    if (!response.ok) throw new Error("Health check failed");
    return response.json();
  })
  .then((health) => { if (health.ok) setStatus("Ready", "ready"); })
  .catch(() => {
    setStatus("Offline", "error");
    showError("The server health check failed. Check the deployment logs.");
  });
