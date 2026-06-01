const API_BASE = "https://api.jikan.moe/v4";

// Automatically inject consistent header & language bar when DOM loads
document.addEventListener("DOMContentLoaded", () => {
 injectConsistentHeader();
 initializeLanguageToggle();
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
            
            <div style="display: flex; background: #111; border: 1px solid var(--neon-green); border-radius: 20px; overflow: hidden; margin-left: 10px;">
                <button id="lang-en" style="background: none; color: #fff; border: none; padding: 5px 12px; font-size: 11px; font-weight: bold; cursor: pointer;">EN</button>
                <button id="lang-jp" style="background: none; color: #fff; border: none; padding: 5px 12px; font-size: 11px; font-weight: bold; cursor: pointer;">JP</button>
            </div>
        </nav>
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
 } else {
  jpBtn.style.background = 'var(--neon-green)';
  jpBtn.style.color = '#000';
 }
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
 const finalRegex = /(?:\s+|\b)(?:Final(?:\s+Season|\s+Part)?|Finale|Last(?:\s+Part|\s+Season))(?:\s+|\b)/i;
 // Detect numeric season or part markers (Season N, Part N, 2nd Season, etc.)
 const seasonRegex = /(?:\s+|\b)(?:Season\s+\d+|Part\s+\d+|\d+(?:st|nd|rd|th)\s+Season)(?:\s+|\b)/i;

 const finalMatch = title.match(finalRegex);
 if (finalMatch) {
  return {
   cleanTitle: title.replace(finalRegex, '').replace(/\s{2,}/g, ' ').trim(),
   seasonText: 'Final Season'
  };
 }

 const match = title.match(seasonRegex);
 return {
  cleanTitle: title.replace(seasonRegex, '').replace(/\s{2,}/g, ' ').trim(),
  seasonText: match ? match[0].trim() : ""
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
