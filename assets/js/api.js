const API_BASE = "https://api.tenrai.org/v1";
const FALLBACK_API_BASE = "https://api.jikan.moe/v4";
const LIVECHART_API_BASE = "https://www.livechart.me/api/v1";
window.siteRoot = /github\.io/i.test(window.location.hostname) ? '/omega-roll' : '';
window.resolveSitePath = (path) => `${window.siteRoot}${path.startsWith('/') ? path : '/' + path}`;
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
        <a href="${window.resolveSitePath('/index.html')}" class="logo">Omega-Roll</a>
        <nav style="display: flex; align-items: center; gap: 20px;">
            <a href="${window.resolveSitePath('/index.html')}" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a>
            <a href="${window.resolveSitePath('/pages/explore.html')}" class="${currentPath === 'explore.html' ? 'active' : ''}">Browse</a>
            <a href="${window.resolveSitePath('/pages/genres.html')}" class="${currentPath === 'genres.html' ? 'active' : ''}">Genres</a>
            <a href="${window.resolveSitePath('/pages/search.html')}" class="${currentPath === 'search.html' ? 'active' : ''}">Search</a>
            <a href="${window.resolveSitePath('/pages/watch-later.html')}" class="${currentPath === 'watch-later.html' ? 'active' : ''}">Watch Later</a>
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

 const enBtn = document.getElementById('lang-en');
 const jpBtn = document.getElementById('lang-jp');

 // Only add listeners if buttons exist (e.g., not on about page)
 if (enBtn) {
  enBtn.onclick = () => {
   localStorage.setItem('globalLanguage', 'EN');
   window.location.reload();
  };
 }
 if (jpBtn) {
  jpBtn.onclick = () => {
   localStorage.setItem('globalLanguage', 'JP');
   window.location.reload();
  };
 }
}

function updateLanguageToggleUI() {
 const currentLang = localStorage.getItem('globalLanguage');
 const enBtn = document.getElementById('lang-en');
 const jpBtn = document.getElementById('lang-jp');

 // Skip if buttons don't exist (e.g., on about page)
 if (!enBtn || !jpBtn) return;

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
 const href = malId ? `${window.resolveSitePath('/pages/anime.html')}?id=${malId}` : (entry.mal_url || '#');
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
async function fetchFromTenrai(endpoint) {
 const sources = [
  { name: 'Tenrai', base: API_BASE },
  { name: 'Jikan', base: FALLBACK_API_BASE }
 ];

 for (const source of sources) {
  try {
   const response = await fetch(`${source.base}${endpoint}`, {
    headers: { Accept: 'application/json' }
   });
   if (!response.ok) throw new Error(`${source.name} response was not ok`);
   return await response.json();
  } catch (error) {
   console.warn(`${source.name} request failed for ${endpoint}:`, error);
  }
 }

 console.error("API Fetch Error:", endpoint);
 return null;
}

async function fetchFromJikan(endpoint) {
 return fetchFromTenrai(endpoint);
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

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    
    // Force consistent card layout, sizing, and uniform spacing
    card.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.2s ease, border-color 0.2s ease;
    `;

    const title = anime.title_english || anime.title || 'Unknown Title';
    const imageUrl = anime.images?.jpg?.image_url || anime.image_url || '';
    const score = anime.score ? `★ ${anime.score}` : 'N/A';
    const episodes = anime.episodes ? `${anime.episodes} eps` : 'TBD';

    card.innerHTML = `
        <div style="width: 100%; aspect-ratio: 2/3; overflow: hidden; background: #000; position: relative;">
            <img src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
        </div>
        <div style="padding: 12px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; gap: 8px;">
            <h4 style="font-size: 0.9rem; font-weight: 600; line-height: 1.3; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.6em; color: #fff;" title="${title}">
                ${title}
            </h4>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #8b949e; margin-top: auto; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                <span style="background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; color: #fff;">${score}</span>
                <span>${episodes}</span>
            </div>
        </div>
    `;

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    card.addEventListener('click', () => {
        window.location.href = `${window.resolveSitePath('/pages/anime.html')}?id=${anime.mal_id}`;
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
