const API_BASE = "https://api.jikan.moe/v4";
const LIVECHART_API_BASE = "https://www.livechart.me/api/v1";

// Automatically inject consistent header & language bar when DOM loads
document.addEventListener("DOMContentLoaded", () => {
 injectConsistentHeader();
 initializeLanguageToggle();
 createSchedulePanel();
});

function injectConsistentHeader() {
 const existingHeader = document.querySelector('header');
 if (!existingHeader) return;

 const currentPath = window.location.pathname.split("/").pop() || "index.html";

 existingHeader.innerHTML = `
        <a href="index.html" class="logo">Omega-Roll</a>
        <nav style="display: flex; align-items: center; gap: 20px;">
            <a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a>
            <a href="explore.html" class="${currentPath === 'explore.html' ? 'active' : ''}">Browse</a>
            <a href="genres.html" class="${currentPath === 'genres.html' ? 'active' : ''}">Genres</a>
            <a href="search.html" class="${currentPath === 'search.html' ? 'active' : ''}">Search</a>
            <a href="watch-later.html" class="${currentPath === 'watch-later.html' ? 'active' : ''}">Watch Later</a>
        </nav>
        <div style="display: flex; align-items: center; gap: 12px;">
            <button id="schedule-toggle" class="header-action-btn">Schedule</button>
            <div style="display: flex; background: #111; border: 1px solid var(--neon-green); border-radius: 20px; overflow: hidden; margin-left: 10px;">
                <button id="lang-en" style="background: none; color: #fff; border: none; padding: 5px 12px; font-size: 11px; font-weight: bold; cursor: pointer;">EN</button>
                <button id="lang-jp" style="background: none; color: #fff; border: none; padding: 5px 12px; font-size: 11px; font-weight: bold; cursor: pointer;">JP</button>
            </div>
        </div>
    `;
}

function initializeLanguageToggle() {
 // Default to English if not set
 if (!localStorage.getItem('globalLanguage')) {
  localStorage.setItem('globalLanguage', 'EN');
 }

 updateLanguageToggleUI();

 document.getElementById('lang-en').onclick = () => {
  localStorage.setItem('globalLanguage', 'EN');
  window.location.reload();
 };
 document.getElementById('lang-jp').onclick = () => {
  localStorage.setItem('globalLanguage', 'JP');
  window.location.reload();
 };
}

function updateLanguageToggleUI() {
 const currentLang = localStorage.getItem('globalLanguage');
 const enBtn = document.getElementById('lang-en');
 const jpBtn = document.getElementById('lang-jp');

 if (currentLang === 'EN') {
  enBtn.style.background = 'var(--neon-green)';
  enBtn.style.color = '#000';
  jpBtn.style.background = 'none';
  jpBtn.style.color = '#fff';
 } else {
  jpBtn.style.background = 'var(--neon-green)';
  jpBtn.style.color = '#000';
  enBtn.style.background = 'none';
  enBtn.style.color = '#fff';
 }
}

function createSchedulePanel() {
 if (document.getElementById('schedule-panel')) return;
 const panel = document.createElement('div');
 panel.id = 'schedule-panel';
 panel.innerHTML = `
  <div class="schedule-panel-header">
   <h2>Weekly Schedule</h2>
   <button id="schedule-close" aria-label="Close">×</button>
  </div>
  <div id="schedule-content"><p class="schedule-loading">Loading schedule…</p></div>
 `;
 document.body.appendChild(panel);

 const overlay = document.createElement('div');
 overlay.id = 'schedule-overlay';
 overlay.addEventListener('click', () => toggleSchedulePanel(false));
 document.body.appendChild(overlay);

 const toggleButton = document.getElementById('schedule-toggle');
 if (toggleButton) {
  toggleButton.addEventListener('click', () => toggleSchedulePanel(true));
 }

 const closeButton = document.getElementById('schedule-close');
 if (closeButton) {
  closeButton.addEventListener('click', () => toggleSchedulePanel(false));
 }
}

async function loadScheduleData() {
 if (window._cachedScheduleData) return window._cachedScheduleData;
 const response = await fetchFromLiveChart('/anime');
 const scheduleData = response && response.items ? response.items : [];
 window._cachedScheduleData = scheduleData;
 return scheduleData;
}

function fetchFromLiveChart(endpoint) {
 return fetch(`${LIVECHART_API_BASE}${endpoint}`)
  .then(response => {
   if (!response.ok) throw new Error('LiveChart response was not ok');
   return response.json();
  })
  .catch(error => {
   console.error('LiveChart Fetch Error:', error);
   return null;
  });
}

function getMALIdFromUrl(url) {
 if (!url) return null;
 const match = url.match(/myanimelist\.net\/anime\/(\d+)/);
 return match ? match[1] : null;
}

function getAnimeTypeLabel(typeId) {
 switch (typeId) {
  case 1: return 'TV';
  case 2: return 'Movie';
  case 3: return 'OVA';
  case 4: return 'Special';
  case 5: return 'ONA';
  default: return 'Anime';
 }
}

function groupScheduleByDay(scheduleList) {
 const grouped = {};
 const sorted = [...scheduleList].sort((a, b) => {
  const aDate = a.premiere_date ? new Date(a.premiere_date).getTime() : 0;
  const bDate = b.premiere_date ? new Date(b.premiere_date).getTime() : 0;
  return aDate - bDate;
 });

 sorted.forEach(entry => {
  const premiereDate = entry.premiere_date ? new Date(entry.premiere_date) : null;
  const day = premiereDate ? premiereDate.toLocaleDateString('en-US', { weekday: 'long' }) : 'Unknown';
  if (!grouped[day]) grouped[day] = [];
  grouped[day].push(entry);
 });
 return grouped;
}

function renderScheduleItem(entry) {
 const imageUrl = entry.poster_image_large || entry.poster_image || '';
 const premiereDate = entry.premiere_date ? new Date(entry.premiere_date) : null;
 const timeText = premiereDate ? ` • ${premiereDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : '';
 const malId = getMALIdFromUrl(entry.mal_url);
 const href = malId ? `anime.html?id=${malId}` : (entry.mal_url || '#');
 const target = malId ? '' : ' target="_blank" rel="noopener noreferrer"';
 const title = entry.english_title || entry.romaji_title || entry.native_title || 'Unknown Title';
 const typeText = getAnimeTypeLabel(entry.anime_type_d || entry.anime_type);
 return `
   <a class="schedule-entry" href="${href}"${target}>
      <img src="${imageUrl}" alt="${title}">
      <div>
        <strong>${title}</strong>
        <small>${typeText}${timeText}</small>
      </div>
   </a>
 `;
}

function renderSchedulePanel(scheduleData) {
 const container = document.getElementById('schedule-content');
 if (!container) return;
 if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
  container.innerHTML = '<p class="schedule-empty">No schedule data available.</p>';
  return;
 }

 const grouped = groupScheduleByDay(scheduleData);
 const days = Object.keys(grouped).sort((a, b) => {
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return order.indexOf(a) - order.indexOf(b);
 });

 container.innerHTML = days.map(day => {
  const entries = grouped[day];
  return `
    <section class="schedule-day-section">
      <h3>${day}</h3>
      <div class="schedule-day-grid">
        ${entries.map(renderScheduleItem).join('')}
      </div>
    </section>
  `;
 }).join('');
}

async function showSchedulePanel() {
 const container = document.getElementById('schedule-content');
 if (!container) return;
 container.innerHTML = '<p class="schedule-loading">Loading schedule…</p>';
 const scheduleData = await loadScheduleData();
 renderSchedulePanel(scheduleData);
}

function toggleSchedulePanel(show) {
 const panel = document.getElementById('schedule-panel');
 const overlay = document.getElementById('schedule-overlay');
 if (!panel || !overlay) return;
 panel.classList.toggle('open', show);
 overlay.classList.toggle('open', show);
 if (show) showSchedulePanel();
}

// Fetch framework utility
async function fetchFromJikan(endpoint) {
 try {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return await response.json();
 } catch (error) {
  console.error("API Fetch Error:", error);
  return null;
 }
}

// Cleans "Season N" from title string matching regulatory syntax regex
function parseSeasonFromTitle(title) {
 // Detect explicit final/last phrasing and normalize to "Final Season"
 const finalRegex = /(?:\b)(?:Final(?:\s+Season|\s+Part)?|Finale|Last(?:\s+Part|\s+Season))(?:\b)/gi;
 // Detect numeric season or part markers (Season N, Part N, 2nd Season, etc.)
 const seasonRegex = /(?:\b)(?:Season\s+\d+|Part\s+\d+|\d+(?:st|nd|rd|th)\s+Season)(?:\b)/gi;

 const finalMatches = title.match(finalRegex) || [];
 const seasonMatches = title.match(seasonRegex) || [];
 const tagMatches = [...finalMatches, ...seasonMatches].map(match => match.trim());
 const seasonText = tagMatches.join(' | ');
 const cleanTitle = title.replace(finalRegex, '').replace(seasonRegex, '').replace(/\s{2,}/g, ' ').trim();
 return {
  cleanTitle,
  seasonText
 };
}

function isValidAnime(anime) {
 const eps = anime.episodes;
 if (eps === null || eps === undefined) return false;
 if (typeof eps === 'string') {
  if (eps.trim().toLowerCase() === 'n/a') return false;
  const parsed = parseInt(eps, 10);
  return !isNaN(parsed) && parsed > 0;
 }
 return Number(eps) > 0;
}

// Shared Component UI Card factory processing global title toggle strings
function createAnimeCard(anime) {
 const card = document.createElement('div');
 card.className = 'anime-card';

 // Toggle logic path selection mapping choice
 const isJP = localStorage.getItem('globalLanguage') === 'JP';
 const isEN = localStorage.getItem('globalLanguage') === 'EN';
 let chosenRawTitle = anime.title;
 if (isJP && anime.title_japanese) chosenRawTitle = anime.title_japanese;
 else if (isEN && anime.title_english) chosenRawTitle = anime.title_english;

 const { cleanTitle, seasonText } = parseSeasonFromTitle(chosenRawTitle);
 const seasonBadge = seasonText ? ` | <span style="color:#fff; background:#111; padding:2px 6px; border-radius:4px; font-size:11px; border:1px solid var(--neon-green)">${seasonText}</span>` : '';
 const episodeLabel = isValidAnime(anime) ? ` • ${anime.episodes} eps` : '';
 const watchLaterList = JSON.parse(localStorage.getItem('watchLater')) || [];
 const isSaved = watchLaterList.some(item => item.id == anime.mal_id);

 card.innerHTML = `
        <div style="position: relative; height: 260px;">
            <img src="${anime.images.jpg.large_image_url}" alt="${cleanTitle}" onclick="window.location.href='anime.html?id=${anime.mal_id}'">
            <button class="watchlist-btn ${isSaved ? 'saved' : ''}" data-id="${anime.mal_id}" data-title="${encodeURIComponent(chosenRawTitle || anime.title)}" data-title-jp="${encodeURIComponent(anime.title_japanese || anime.title)}" data-img="${anime.images.jpg.large_image_url}">
                ${isSaved ? '★ Saved' : '☆ Watch Later'}
            </button>
        </div>
        <div class="info" onclick="window.location.href='anime.html?id=${anime.mal_id}'">
            <h3>${cleanTitle}</h3>
            <span>★ ${anime.score || 'N/A'}${episodeLabel}${seasonBadge}</span>
        </div>
    `;

 card.querySelector('.watchlist-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleWatchLater(e.target);
 });

 return card;
}

function toggleWatchLater(button) {
 let watchLaterList = JSON.parse(localStorage.getItem('watchLater')) || [];
 const id = button.dataset.id;

 const index = watchLaterList.findIndex(item => item.id == id);
 if (index > -1) {
  watchLaterList.splice(index, 1);
  button.classList.remove('saved');
  button.innerText = '☆ Watch Later';
 } else {
  watchLaterList.push({
   id: id,
   title: decodeURIComponent(button.dataset.title),
   title_japanese: decodeURIComponent(button.dataset.titleJp),
   img: button.dataset.img,
   addedAt: Date.now()
  });
  button.classList.add('saved');
  button.innerText = '★ Saved';
 }
 localStorage.setItem('watchLater', JSON.stringify(watchLaterList));
}
