"use strict";

const tabsBar = document.getElementById("tabsBar");
const newTabButton = document.getElementById("newTabButton");
const privateButton = document.getElementById("privateButton");

const addressInput = document.getElementById("addressInput");
const goButton = document.getElementById("goButton");

const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const reloadButton = document.getElementById("reloadButton");
const homeButton = document.getElementById("homeButton");

const homePage = document.getElementById("homePage");
const browserPage = document.getElementById("browserPage");
const historyPanel = document.getElementById("historyPanel");

const browserFrame = document.getElementById("browserFrame");
const externalButton = document.getElementById("externalButton");

const historyButton = document.getElementById("historyButton");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const searchEngine = document.getElementById("searchEngine");
const homeSearchInput = document.getElementById("homeSearchInput");
const homeSearchButton = document.getElementById("homeSearchButton");

const HOME_URL = "about:blank";

let tabs = [];
let activeTabId = null;
let privateMode = false;

let historyItems = loadHistory();

function createTab(isPrivate = privateMode) {
  const tab = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random()),

    title: isPrivate ? "Onglet privé" : "Nouvel onglet",
    url: HOME_URL,
    isPrivate,
    history: []
  };

  tabs.push(tab);
  activeTabId = tab.id;

  renderTabs();
  showTabContent();

  return tab;
}

function getActiveTab() {
  return tabs.find(tab => tab.id === activeTabId);
}

function renderTabs() {
  tabsBar.innerHTML = "";

  tabs.forEach(tab => {
    const tabElement = document.createElement("div");
    tabElement.className = "tab";

    if (tab.id === activeTabId) {
      tabElement.classList.add("active");
    }

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.isPrivate
      ? "🕶️ " + tab.title
      : tab.title;

    title.addEventListener("click", () => {
      activeTabId = tab.id;
      renderTabs();
      showTabContent();
    });

    const closeButton = document.createElement("button");
    closeButton.className = "close-tab";
    closeButton.textContent = "×";
    closeButton.title = "Fermer cet onglet";

    closeButton.addEventListener("click", event => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    tabElement.appendChild(title);
    tabElement.appendChild(closeButton);

    tabElement.addEventListener("click", () => {
      activeTabId = tab.id;
      renderTabs();
      showTabContent();
    });

    tabsBar.appendChild(tabElement);
  });
}

function closeTab(tabId) {
  const index = tabs.findIndex(tab => tab.id === tabId);

  if (index === -1) {
    return;
  }

  tabs.splice(index, 1);

  if (tabs.length === 0) {
    createTab(privateMode);
    return;
  }

  if (activeTabId === tabId) {
    const newIndex = Math.max(0, index - 1);
    activeTabId = tabs[newIndex].id;
  }

  renderTabs();
  showTabContent();
}

function showTabContent() {
  const tab = getActiveTab();

  if (!tab) {
    return;
  }

  addressInput.value = tab.url === HOME_URL ? "" : tab.url;

  if (tab.url === HOME_URL) {
    homePage.classList.remove("hidden");
    browserPage.classList.add("hidden");
    historyPanel.classList.add("hidden");
    browserFrame.src = HOME_URL;
  } else {
    homePage.classList.add("hidden");
    historyPanel.classList.add("hidden");
    browserPage.classList.remove("hidden");

    browserFrame.src = tab.url;
  }
}

function normalizeUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return HOME_URL;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  if (
    trimmed.includes(".") &&
    !trimmed.includes(" ")
  ) {
    return "https://" + trimmed;
  }

  const selectedEngine = searchEngine.value;

  return selectedEngine + encodeURIComponent(trimmed);
}

function navigate(value) {
  const tab = getActiveTab();

  if (!tab) {
    return;
  }

  const url = normalizeUrl(value);

  tab.url = url;
  tab.title = getTitleFromUrl(url);

  tab.history.push(url);

  if (!tab.isPrivate) {
    saveHistoryItem(url);
  }

  renderTabs();
  showTabContent();
}

function getTitleFromUrl(url) {
  if (url === HOME_URL) {
    return "Nouvel onglet";
  }

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Page web";
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem("webworld_history");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveHistoryItem(url) {
  const item = {
    url,
    date: new Date().toLocaleString("fr-FR")
  };

  historyItems = [
    item,
    ...historyItems.filter(entry => entry.url !== url)
  ].slice(0, 100);

  localStorage.setItem(
    "webworld_history",
    JSON.stringify(historyItems)
  );
}

function renderHistory() {
  historyList.innerHTML = "";

  if (historyItems.length === 0) {
    historyList.textContent = "Aucun historique enregistré.";
    return;
  }

  historyItems.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-item";

    const link = document.createElement("a");
    link.href = "#";
    link.textContent = item.url;

    link.addEventListener("click", event => {
      event.preventDefault();

      historyPanel.classList.add("hidden");
      navigate(item.url);
    });

    const date = document.createElement("span");
    date.className = "history-date";
    date.textContent = item.date;

    row.appendChild(link);
    row.appendChild(date);

    historyList.appendChild(row);
  });
}

function toggleHistory() {
  const isHidden = historyPanel.classList.contains("hidden");

  if (isHidden) {
    homePage.classList.add("hidden");
    browserPage.classList.add("hidden");
    historyPanel.classList.remove("hidden");
    renderHistory();
  } else {
    historyPanel.classList.add("hidden");
    showTabContent();
  }
}

function togglePrivateMode() {
  privateMode = !privateMode;

  privateButton.classList.toggle("active", privateMode);
  privateButton.textContent = privateMode
    ? "🕶️ Privé activé"
    : "🕶️ Privé";

  if (privateMode) {
    createTab(true);
  } else {
    tabs = tabs.filter(tab => !tab.isPrivate);

    if (tabs.length === 0) {
      createTab(false);
    } else {
      activeTabId = tabs[0].id;
      renderTabs();
      showTabContent();
    }
  }
}

function performHomeSearch() {
  const query = homeSearchInput.value.trim();

  if (!query) {
    homeSearchInput.focus();
    return;
  }

  navigate(query);
}

newTabButton.addEventListener("click", () => {
  createTab(privateMode);
});

privateButton.addEventListener("click", togglePrivateMode);

goButton.addEventListener("click", () => {
  navigate(addressInput.value);
});

addressInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    navigate(addressInput.value);
  }
});

homeSearchButton.addEventListener("click", performHomeSearch);

homeSearchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    performHomeSearch();
  }
});

homeButton.addEventListener("click", () => {
  const tab = getActiveTab();

  if (!tab) {
    return;
  }

  tab.url = HOME_URL;
  tab.title = "Nouvel onglet";

  renderTabs();
  showTabContent();
});

reloadButton.addEventListener("click", () => {
  if (browserFrame.src !== HOME_URL) {
    browserFrame.src = browserFrame.src;
  }
});

backButton.addEventListener("click", () => {
  try {
    browserFrame.contentWindow.history.back();
  } catch {
    window.history.back();
  }
});

forwardButton.addEventListener("click", () => {
  try {
    browserFrame.contentWindow.history.forward();
  } catch {
    window.history.forward();
  }
});

externalButton.addEventListener("click", () => {
  const tab = getActiveTab();

  if (tab && tab.url !== HOME_URL) {
    window.location.href = tab.url;
  }
});

historyButton.addEventListener("click", toggleHistory);

clearHistoryButton.addEventListener("click", () => {
  historyItems = [];
  localStorage.removeItem("webworld_history");
  renderHistory();
});

browserFrame.addEventListener("load", () => {
  const tab = getActiveTab();

  if (!tab) {
    return;
  }

  try {
    const frameUrl = browserFrame.contentWindow.location.href;

    if (
      frameUrl &&
      frameUrl !== "about:blank" &&
      frameUrl !== tab.url
    ) {
      tab.url = frameUrl;
      tab.title = getTitleFromUrl(frameUrl);

      if (!tab.isPrivate) {
        saveHistoryItem(frameUrl);
      }

      addressInput.value = frameUrl;
      renderTabs();
    }
  } catch {
    // Les sites externes peuvent empêcher l’accès à leur URL.
  }
});

// Démarrage
createTab(false);
