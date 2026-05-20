const STORAGE_KEY = "nova-search-settings-v1";
const HISTORY_KEY = "nova-search-history-v1";

const DEFAULT_SETTINGS = {
  apiToken: "",
  apiBase: "https://api.search.brave.com/res/v1/web/search",
  country: "US",
  searchLang: "en",
  uiLang: navigator.language || "en-US",
  safeSearch: "moderate",
  resultsPerPage: 10,
  freshness: "",
  hideSponsored: true,
  stripTracking: true,
  rememberHistory: true,
  blockedDomains: [
    "doubleclick.net",
    "googleadservices.com",
    "googlesyndication.com",
    "taboola.com",
    "outbrain.com",
    "adsystem.com",
    "adservice.google.com"
  ].join("\n")
};

const els = {
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  results: document.getElementById("results"),
  statusPill: document.getElementById("statusPill"),
  queryInfo: document.getElementById("queryInfo"),
  pageLabel: document.getElementById("pageLabel"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsOverlay: document.getElementById("settingsOverlay"),
  closeSettings: document.getElementById("closeSettings"),
  saveSettings: document.getElementById("saveSettings"),
  resetSettings: document.getElementById("resetSettings"),
  apiToken: document.getElementById("apiToken"),
  apiBase: document.getElementById("apiBase"),
  country: document.getElementById("country"),
  searchLang: document.getElementById("searchLang"),
  uiLang: document.getElementById("uiLang"),
  safeSearch: document.getElementById("safeSearch"),
  resultsPerPage: document.getElementById("resultsPerPage"),
  freshness: document.getElementById("freshness"),
  hideSponsored: document.getElementById("hideSponsored"),
  stripTracking: document.getElementById("stripTracking"),
  rememberHistory: document.getElementById("rememberHistory"),
  blockedDomains: document.getElementById("blockedDomains"),
  historyWrap: document.getElementById("historyWrap"),
  historyList: document.getElementById("historyList")
};

let settings = loadSettings();
let history = loadHistory();

let state = {
  query: "",
  page: 0,
  loading: false,
  moreResults: false
};

hydrateSettingsUI();
renderHistory();

els.settingsBtn.addEventListener("click", openSettings);
els.closeSettings.addEventListener("click", closeSettings);
els.settingsOverlay.addEventListener("click", (e) => {
  if (e.target === els.settingsOverlay) closeSettings();
});
els.saveSettings.addEventListener("click", () => {
  saveSettingsFromUI();
  closeSettings();
});
els.resetSettings.addEventListener("click", () => {
  settings = structuredClone(DEFAULT_SETTINGS);
  saveSettings();
  hydrateSettingsUI();
  setStatus("Settings reset");
});

els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch(els.searchInput.value.trim(), 0);
});

els.prevPage.addEventListener("click", () => {
  if (state.page > 0) runSearch(state.query, state.page - 1);
});

els.nextPage.addEventListener("click", () => {
  if (state.moreResults) runSearch(state.query, state.page + 1);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== els.searchInput) {
    e.preventDefault();
    els.searchInput.focus();
  }

  if (e.key === "Escape") {
    closeSettings();
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openSettings();
  }
});

if (settings.apiToken) {
  setStatus("Ready");
} else {
  setStatus("Add Brave token in Settings");
}

if (history.length && settings.rememberHistory) {
  els.historyWrap.classList.remove("hidden");
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    return { ...structuredClone(DEFAULT_SETTINGS), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw).slice(0, 12);
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
}

function hydrateSettingsUI() {
  els.apiToken.value = settings.apiToken || "";
  els.apiBase.value = settings.apiBase || DEFAULT_SETTINGS.apiBase;
  els.country.value = settings.country || "US";
  els.searchLang.value = settings.searchLang || "en";
  els.uiLang.value = settings.uiLang || "en-US";
  els.safeSearch.value = settings.safeSearch || "moderate";
  els.resultsPerPage.value = settings.resultsPerPage || 10;
  els.freshness.value = settings.freshness || "";
  els.hideSponsored.checked = !!settings.hideSponsored;
  els.stripTracking.checked = !!settings.stripTracking;
  els.rememberHistory.checked = !!settings.rememberHistory;
  els.blockedDomains.value = settings.blockedDomains || "";
}

function saveSettingsFromUI() {
  settings = {
    apiToken: els.apiToken.value.trim(),
    apiBase: els.apiBase.value.trim() || DEFAULT_SETTINGS.apiBase,
    country: (els.country.value.trim() || "US").toUpperCase(),
    searchLang: els.searchLang.value.trim() || "en",
    uiLang: els.uiLang.value.trim() || "en-US",
    safeSearch: els.safeSearch.value,
    resultsPerPage: clampInt(els.resultsPerPage.value, 1, 20, 10),
    freshness: els.freshness.value.trim(),
    hideSponsored: els.hideSponsored.checked,
    stripTracking: els.stripTracking.checked,
    rememberHistory: els.rememberHistory.checked,
    blockedDomains: els.blockedDomains.value
  };

  saveSettings();
  setStatus("Settings saved");
  renderHistory();
}

function openSettings() {
  hydrateSettingsUI();
  els.settingsOverlay.classList.remove("hidden");
  els.settingsOverlay.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  els.settingsOverlay.classList.add("hidden");
  els.settingsOverlay.setAttribute("aria-hidden", "true");
}

function setStatus(text, kind = "normal") {
  els.statusPill.textContent = text;
  els.statusPill.style.background =
    kind === "error"
      ? "rgba(255, 100, 124, 0.14)"
      : kind === "loading"
      ? "rgba(37, 208, 171, 0.12)"
      : "rgba(124, 92, 255, 0.13)";
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function runSearch(query, page = 0) {
  query = query.trim();
  if (!query) {
    setStatus("Type a search query", "error");
    return;
  }

  if (!settings.apiToken) {
    setStatus("Add Brave token first", "error");
    openSettings();
    return;
  }

  state.query = query;
  state.page = page;
  state.loading = true;
  state.moreResults = false;

  els.prevPage.disabled = true;
  els.nextPage.disabled = true;
  els.results.innerHTML = renderLoading();
  setStatus("Searching…", "loading");
  els.queryInfo.textContent = `${query} · page ${page + 1}`;
  els.pageLabel.textContent = `Page ${page + 1}`;

  try {
    const url = buildRequestUrl(query, page);
    const response = await fetch(url.toString(), {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "X-Subscription-Token": settings.apiToken
      }
    });

    if (!response.ok) {
      const body = await safeJson(response);
      throw new Error(body?.message || body?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const results = extractResults(data).filter(shouldKeepResult);

    renderResults(data, results);
    state.moreResults = !!data?.query?.more_results_available && results.length > 0;

    els.prevPage.disabled = page <= 0;
    els.nextPage.disabled = !state.moreResults;

    const altered = data?.query?.altered;
    if (altered && altered !== query) {
      els.queryInfo.textContent = `Showing results for “${altered}”`;
    }

    if (settings.rememberHistory) {
      addToHistory(query);
    }

    setStatus(results.length ? `Found ${results.length} results` : "No results");
  } catch (err) {
    console.error(err);
    els.results.innerHTML = renderError(err.message || "Search failed");
    setStatus("Search failed", "error");
    els.prevPage.disabled = page <= 0;
    els.nextPage.disabled = true;
  } finally {
    state.loading = false;
  }
}

function buildRequestUrl(query, page) {
  const base = settings.apiBase || DEFAULT_SETTINGS.apiBase;
  const url = new URL(base);

  url.searchParams.set("q", query);
  url.searchParams.set("country", settings.country || "US");
  url.searchParams.set("search_lang", settings.searchLang || "en");
  url.searchParams.set("ui_lang", settings.uiLang || "en-US");
  url.searchParams.set("count", String(clampInt(settings.resultsPerPage, 1, 20, 10)));
  url.searchParams.set("offset", String(Math.min(9, Math.max(0, page))));
  url.searchParams.set("safesearch", settings.safeSearch || "moderate");
  url.searchParams.set("spellcheck", "true");
  url.searchParams.set("text_decorations", "false");
  url.searchParams.set("result_filter", "web");
  url.searchParams.set("operators", "true");

  if (settings.freshness) {
    url.searchParams.set("freshness", settings.freshness);
  }

  return url;
}

function extractResults(data) {
  const arrays = [];

  if (Array.isArray(data?.web?.results)) arrays.push(...data.web.results);
  if (Array.isArray(data?.mixed?.results)) arrays.push(...data.mixed.results);
  if (Array.isArray(data?.news?.results)) arrays.push(...data.news.results);
  if (Array.isArray(data?.videos?.results)) arrays.push(...data.videos.results);
  if (Array.isArray(data?.locations?.results)) arrays.push(...data.locations.results);

  return arrays;
}

function shouldKeepResult(item) {
  if (!settings.hideSponsored) return true;

  const title = safeText(item.title || item.name || "");
  const snippet = safeText(item.description || item.snippet || item.content || "");
  const url = normalizeUrl(item.url || item.link || item.destination || "");
  const domain = domainFromUrl(url).toLowerCase();

  const blocked = getBlockedDomains();
  if (blocked.some((d) => domain === d || domain.endsWith(`.${d}`))) return false;

  const promotional = /(sponsored|advertisement|promoted|ad\s|ads\s|affiliate)/i;
  return !(promotional.test(title) || promotional.test(snippet));
}

function getBlockedDomains() {
  return (settings.blockedDomains || "")
    .split(/[\n,]/g)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    if (settings.stripTracking) {
      const trackingKeys = [
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source", "spm", "cmpid"
      ];
      trackingKeys.forEach((k) => u.searchParams.delete(k));
    }
    return u.toString();
  } catch {
    return raw || "#";
  }
}

function domainFromUrl(raw) {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function safeText(v) {
  return String(v || "");
}

function renderResults(data, results) {
  const altered = data?.query?.altered;
  const totalInfo = altered && altered !== state.query
    ? `Showing results for “${altered}”`
    : `${results.length} result${results.length === 1 ? "" : "s"}`;

  els.queryInfo.textContent = `${state.query} · ${totalInfo}`;

  if (!results.length) {
    els.results.innerHTML = `
      <div class="card">
        <h3 class="card-title">No results found</h3>
        <p class="card-snippet">Try a different query, lower the filters, or change the country/language settings.</p>
      </div>
    `;
    return;
  }

  els.results.innerHTML = results
    .map((item, index) => renderCard(item, index))
    .join("");
}

function renderCard(item, index) {
  const rawUrl = item.url || item.link || item.destination || "";
  const url = normalizeUrl(rawUrl);
  const title = escapeHtml(item.title || item.name || rawUrl || "Untitled result");
  const domain = escapeHtml(domainFromUrl(rawUrl) || "unknown");
  const snippet = escapeHtml(item.description || item.snippet || item.content || item.meta_description || "");
  const age = escapeHtml(item.age || item.page_age || item.published || item.updated || "");
  const icon = escapeHtml((item.profile && item.profile.name) ? item.profile.name : "");

  return `
    <article class="card">
      <div class="card-top">
        <div>
          <h3 class="card-title">
            <a href="${url}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">
              ${title}
            </a>
          </h3>
          <div class="card-domain">${domain}</div>
        </div>
        ${icon ? `<div class="tag">${icon}</div>` : ""}
      </div>

      ${snippet ? `<p class="card-snippet">${snippet}</p>` : ""}

      <div class="card-foot">
        ${age ? `<span class="tag">${age}</span>` : ""}
        <div class="link-row">
          <button class="link-btn" data-copy="${escapeAttr(url)}">Copy link</button>
          <a class="link-btn" href="${url}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Open</a>
        </div>
      </div>
    </article>
  `;
}

function renderLoading() {
  return `
    <div class="card">
      <h3 class="card-title">Searching…</h3>
      <p class="card-snippet">Fetching Brave Search results.</p>
    </div>
  `;
}

function renderError(message) {
  return `
    <div class="card error">
      <h3 class="card-title">Something went wrong</h3>
      <p class="card-snippet">${escapeHtml(message)}</p>
    </div>
  `;
}

function addToHistory(query) {
  const clean = query.trim();
  if (!clean) return;

  history = [clean, ...history.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 12);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (!settings.rememberHistory || !history.length) {
    els.historyWrap.classList.toggle("hidden", true);
    els.historyList.innerHTML = "";
    return;
  }

  els.historyWrap.classList.remove("hidden");
  els.historyList.innerHTML = history
    .map((q) => `<button class="chip" data-history="${escapeAttr(q)}">${escapeHtml(q)}</button>`)
    .join("");

  els.historyList.querySelectorAll("[data-history]").forEach((btn) => {
    btn.addEventListener("click", () => {
      els.searchInput.value = btn.getAttribute("data-history");
      runSearch(els.searchInput.value.trim(), 0);
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

document.addEventListener("click", async (e) => {
  const copyBtn = e.target.closest("[data-copy]");
  if (!copyBtn) return;

  const text = copyBtn.getAttribute("data-copy");
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy link";
    }, 1000);
  } catch {
    setStatus("Clipboard blocked by browser", "error");
  }
});
