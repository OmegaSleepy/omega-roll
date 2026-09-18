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

 const hasEnhancedHeader = !!(
   document.getElementById('schedule-toggle') ||
   document.getElementById('shortcut-help-btn') ||
   document.getElementById('lang-en')
 );

 if (hasEnhancedHeader) return;

 const currentPath = window.location.pathname.split("/").pop() || "index.html";

 existingHeader.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to content</a>
        <a href="${window.resolveSitePath('/index.html')}" class="logo">Omega-Roll</a>
        <nav aria-label="Primary">
            <a href="${window.resolveSitePath('/index.html')}" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a>
            <a href="${window.resolveSitePath('/pages/explore.html')}" class="${currentPath === 'explore.html' ? 'active' : ''}">Browse</a>
            <a href="${window.resolveSitePath('/pages/genres.html')}" class="${currentPath === 'genres.html' ? 'active' : ''}">Genres</a>
            <a href="${window.resolveSitePath('/pages/search.html')}" class="${currentPath === 'search.html' ? 'active' : ''}">Search</a>
            <a href="${window.resolveSitePath('/pages/watch-later.html')}" class="${currentPath === 'watch-later.html' ? 'active' : ''}">Watch Later</a>
            <a href="${window.resolveSitePath('/pages/about.html')}" class="${currentPath === 'about.html' ? 'active' : ''}">About</a>
        </nav>
        <div class="header-actions">
            <button id="schedule-toggle" class="header-action-btn" type="button">Schedule</button>
            <button type="button" class="header-action-btn" id="shortcut-help-btn" aria-expanded="false" aria-controls="shortcut-help">Shortcuts</button>
            <div class="language-toggle" aria-label="Language selector">
                <button id="lang-en" class="language-btn active" type="button" data-lang="EN" aria-pressed="true">EN</button>
                <button id="lang-jp" class="language-btn" type="button" data-lang="JP" aria-pressed="false">JP</button>
            </div>
        </div>
        <div id="shortcut-help" class="shortcut-help" role="dialog" aria-label="Keyboard shortcuts"></div>
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

 const isEnglish = currentLang === 'EN';

 enBtn.classList.toggle('active', isEnglish);
 jpBtn.classList.toggle('active', !isEnglish);
 enBtn.setAttribute('aria-pressed', String(isEnglish));
 jpBtn.setAttribute('aria-pressed', String(!isEnglish));
}


function createSchedulePanel() {
    if (document.getElementById('schedule-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'schedule-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Weekly Schedule');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('tabindex', '-1');

    panel.innerHTML = `
     <div class="schedule-panel-header">
        <h2>Weekly Schedule</h2>
        <div style="display:flex; gap:8px; align-items:center;">
            <button id="schedule-clear-all" class="header-action-btn" aria-label="Clear all followed shows">Clear All</button>
            <button id="schedule-close" aria-label="Close schedule panel">×</button>
        </div>
     </div>
     <div id="schedule-content"><p class="schedule-loading">Loading schedule…</p></div>
    `;
    document.body.appendChild(panel);

    const overlay = document.createElement('div');
    overlay.id = 'schedule-overlay';
    overlay.className = 'schedule-overlay';
    overlay.addEventListener('click', () => toggleSchedulePanel(false));
    document.body.appendChild(overlay);

    const toggleButton = document.getElementById('schedule-toggle');
    if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.addEventListener('click', () => toggleSchedulePanel(true));
    }

    const closeButton = document.getElementById('schedule-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => toggleSchedulePanel(false));
    }

    const clearAllBtn = document.getElementById('schedule-clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (!confirm('Clear all followed shows? This cannot be undone.')) return;
            localStorage.removeItem('followSchedule');
            window._cachedScheduleData = null;
            const container = document.getElementById('schedule-content');
            if (container) container.innerHTML = '<p class="schedule-loading">Loading schedule…</p>';
            await showSchedulePanel();
        });
    }

    // Global Keydown Handler: Close schedule when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const openPanel = document.getElementById('schedule-panel');
            if (openPanel && openPanel.classList.contains('open')) {
                toggleSchedulePanel(false);
            }
        }
    });
}

function toggleSchedulePanel(show) {
    const panel = document.getElementById('schedule-panel');
    const overlay = document.getElementById('schedule-overlay');
    const toggleButton = document.getElementById('schedule-toggle');
    const closeButton = document.getElementById('schedule-close');

    if (!panel || !overlay) return;

    panel.classList.toggle('open', show);
    overlay.classList.toggle('open', show);

    if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', String(show));
    }

    if (show) {
        showSchedulePanel();
        // Focus inside panel when opened for keyboard access
        if (closeButton) {
            setTimeout(() => closeButton.focus(), 50);
        }
    } else {
        // Return focus to toggle button when closed
        if (toggleButton) {
            toggleButton.focus();
        }
    }
}

function getFollowedList() {
    return JSON.parse(localStorage.getItem('followSchedule')) || [];
}

function saveFollowedList(list) {
    localStorage.setItem('followSchedule', JSON.stringify(list));
}

async function loadScheduleData() {
    if (window._cachedScheduleData) return window._cachedScheduleData;
    const followed = getFollowedList();
    const upcoming = [];

    for (const item of followed) {
        const animeId = item.animeId || item.id || item;
        try {
            // Always fetch or fallback to live API data if saved fields are missing
            let anime = null;
            const apiResp = await fetchFromTenrai(`/anime/${animeId}`);
            if (apiResp && apiResp.data) {
                anime = apiResp.data;
            }

            // Extract values with priority on live API data, then local storage
            const title = anime?.title_english || anime?.title || item.title || 'Unknown Title';
            const image = anime?.images?.jpg?.large_image_url || anime?.images?.jpg?.image_url || item.image || '';
            const airedFromStr = anime?.aired?.from || item.airedFrom || null;
            const broadcastTime = anime?.broadcast?.time || item.broadcastTime || "22:00";
            const timezone = anime?.broadcast?.timezone || item.broadcastTimezone || "Asia/Tokyo";
            const announced = parseInt(anime?.episodes || item.announcedCount || 0, 10);

            if (!airedFromStr) {
                console.warn(`Skipping schedule calculation for ${title}: No starting air date available.`);
                continue;
            }

            // Determine released episode count and the most recent actual air date from the API,
            // then anchor future schedule cards from the latest release instead of the first series date.
            let releasedCount = 0;
            let latestReleasedDate = null;
            try {
                const firstResp = await fetchFromTenrai(`/anime/${animeId}/episodes?page=1`);
                const firstData = (firstResp && Array.isArray(firstResp.data)) ? firstResp.data : [];
                const firstCount = firstData.length;

                if (firstResp && firstResp.pagination && firstResp.pagination.last_visible_page) {
                    const lastPage = Number(firstResp.pagination.last_visible_page) || 1;
                    const lastResp = lastPage > 1 ? await fetchFromTenrai(`/anime/${animeId}/episodes?page=${lastPage}`) : firstResp;
                    const lastPageItems = (lastResp && Array.isArray(lastResp.data)) ? lastResp.data : [];
                    const items = lastPageItems.length ? lastPageItems : firstData;

                    const validItems = items
                        .map(ep => ({
                            ...ep,
                            airedAt: ep?.aired ? new Date(ep.aired).getTime() : NaN,
                            epNumber: Number(ep?.episode ?? ep?.mal_id ?? 0)
                        }))
                        .filter(ep => !Number.isNaN(ep.airedAt) && ep.airedAt <= Date.now());

                    if (validItems.length) {
                        const latest = validItems.reduce((max, current) => (current.airedAt > max.airedAt ? current : max), validItems[0]);
                        latestReleasedDate = new Date(latest.airedAt);
                        releasedCount = validItems.reduce((max, current) => Math.max(max, current.epNumber || 0), 0) || validItems.length;
                    } else {
                        releasedCount = firstCount;
                    }
                } else if (firstResp && Array.isArray(firstResp.data)) {
                    const validItems = firstResp.data
                        .map(ep => ({ ...ep, airedAt: ep?.aired ? new Date(ep.aired).getTime() : NaN }))
                        .filter(ep => !Number.isNaN(ep.airedAt) && ep.airedAt <= Date.now());
                    if (validItems.length) {
                        latestReleasedDate = new Date(Math.max(...validItems.map(ep => ep.airedAt)));
                        releasedCount = validItems.length;
                    } else {
                        releasedCount = firstResp.data.length;
                    }
                }
            } catch (e) {
                console.warn('Episode count fetch error:', e);
            }

            const announcedCount = announced || 0;
            const remaining = Math.max(0, announcedCount - releasedCount);

            if (remaining > 0) {
                // Anchor from the most recent actual release instead of the start date so gaps are accounted for.
                const baseDate = latestReleasedDate && !Number.isNaN(latestReleasedDate.getTime())
                    ? latestReleasedDate
                    : (airedFromStr ? new Date(airedFromStr) : new Date());

                for (let offset = 1; offset <= remaining; offset++) {
                    const ep = releasedCount + offset;
                    const epDate = new Date(baseDate.getTime() + (offset - 1) * 7 * 24 * 60 * 60 * 1000);
                    let airInstant = null;
                    if (broadcastTime && timezone) {
                        const y = epDate.getUTCFullYear();
                        const m = String(epDate.getUTCMonth() + 1).padStart(2, '0');
                        const d = String(epDate.getUTCDate()).padStart(2, '0');
                        airInstant = computeInstantForLocal(`${y}-${m}-${d}`, broadcastTime, timezone);
                    }
                    const airIso = airInstant ? new Date(airInstant).toISOString() : epDate.toISOString();
                    upcoming.push({
                        animeId,
                        title,
                        image,
                        epNumber: ep,
                        airDate: airIso,
                        releasedCount,
                        announcedCount: announcedCount,
                        mal_id: anime?.mal_id || null,
                        broadcastTimezone: timezone,
                        broadcastTime: broadcastTime
                    });
                }
            }
        } catch (e) {
            console.warn('Failed to calculate schedule for anime:', animeId, e);
        }
    }

    upcoming.sort((a, b) => new Date(a.airDate) - new Date(b.airDate));
    // Do not filter out past dates here; return all generated upcoming schedule entries
    window._cachedScheduleData = upcoming;
    return upcoming;
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
    const date = new Date(entry.airDate);
        const dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
        const timeLabel = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);

        const removeBtn = `<button class="schedule-unfollow" data-id="${entry.animeId}" aria-label="Unfollow" title="Remove">x</button>`;

        return `
                <div class="schedule-entry">
                    ${removeBtn}
                    <div class="schedule-entry-content">
                        <div class="schedule-entry-main">
                            <div class="schedule-entry-title">${entry.title}</div>
                            <div class="schedule-entry-ep">Ep ${entry.epNumber}</div>
                            <div class="schedule-entry-meta">${dayLabel} • ${timeLabel}</div>
                        </div>
                        <div class="schedule-entry-right">
                            <img class="schedule-entry-thumb" src="${entry.image}" alt="${entry.title}">
                            <a class="schedule-view-btn" href="${window.resolveSitePath('/pages/watch.html')}?animeId=${entry.animeId}&ep=${entry.epNumber}">View</a>
                        </div>
                    </div>
                </div>
        `;
}

// Compute the UTC epoch milliseconds for a local date/time in an IANA timezone.
// Uses a binary search over a 48-hour window to find the instant whose
// formatted local fields match the requested local date/time. This handles DST.
function computeInstantForLocal(dateStr /* YYYY-MM-DD */, timeStr /* HH:MM */, timeZone) {
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute] = timeStr.split(':').map(s => Number(s));
        const target = { year, month, day, hour, minute };

        // Search window: start at UTC midnight of the day, expand +- 24h
        const utcMid = Date.UTC(year, month - 1, day, 0, 0, 0);
        let low = utcMid - 24 * 3600 * 1000;
        let high = utcMid + 24 * 3600 * 1000;

        const fmt = (ms) => {
            const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms));
            const out = {};
            parts.forEach(p => { if (p.type !== 'literal') out[p.type] = p.value; });
            return out;
        };

        for (let i = 0; i < 50 && low <= high; i++) {
            const mid = Math.floor((low + high) / 2);
            const p = fmt(mid);
            const py = Number(p.year), pm = Number(p.month), pd = Number(p.day), ph = Number(p.hour), pmin = Number(p.minute);
            if (py === target.year && pm === target.month && pd === target.day && ph === target.hour && pmin === target.minute) {
                return mid;
            }
            // Compare lexicographically by date-time
            if (py < target.year || (py === target.year && (pm < target.month || (pm === target.month && (pd < target.day || (pd === target.day && (ph < target.hour || (ph === target.hour && pmin < target.minute)))))))) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
    } catch (e) {
        console.warn('computeInstantForLocal failed', e);
    }
    return null;
}

function renderSchedulePanel(scheduleData) {
    const container = document.getElementById('schedule-content');
    if (!container) return;
    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
        container.innerHTML = '<p class="schedule-empty">No followed shows yet. Use the "Follow Schedule" button on an anime page to add shows.</p>';
        return;
    }

    // Group upcoming episodes by calendar day
    const grouped = {};
    scheduleData.forEach(entry => {
        const d = new Date(entry.airDate);
        const key = d.toISOString().slice(0,10); // YYYY-MM-DD
        if (!grouped[key]) grouped[key] = { date: d, items: [] };
        grouped[key].items.push(entry);
    });

    const keys = Object.keys(grouped).sort((a,b) => new Date(a) - new Date(b));
    if (keys.length === 0) {
        container.innerHTML = '<p class="schedule-empty">No upcoming episodes for followed shows.</p>';
        return;
    }

    container.innerHTML = keys.map(key => {
        const day = grouped[key];
        const dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(day.date);
        return `
            <section class="schedule-day-section">
                <h3>${dayLabel}</h3>
                <div class="schedule-day-grid">
                    ${day.items.map(renderScheduleItem).join('')}
                </div>
            </section>
        `;
    }).join('');

    // Attach unfollow handlers
    container.querySelectorAll('.schedule-unfollow').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            let list = getFollowedList();
            list = list.filter(i => String(i.animeId || i.id || i) !== String(id));
            saveFollowedList(list);
            window._cachedScheduleData = null;
            const updated = await loadScheduleData();
            renderSchedulePanel(updated);
        });
    });
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
