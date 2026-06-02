document.addEventListener("DOMContentLoaded", () => {
 renderContinueWatching();
 renderSavedAnime();
 renderPinnedEpisodes();

 // wire up search and sort controls
 const searchInput = document.getElementById('wl-search');
 const sortSelect = document.getElementById('wl-sort');
 if (searchInput) searchInput.addEventListener('input', () => renderSavedAnime());
 if (sortSelect) sortSelect.addEventListener('change', () => renderSavedAnime());
});

function renderSavedAnime() {
 const savedGrid = document.getElementById('saved-anime-grid');
 const savedSeries = JSON.parse(localStorage.getItem('watchLater')) || [];
 const isJP = localStorage.getItem('globalLanguage') === 'JP';
 const query = (document.getElementById('wl-search') || {}).value || '';
 const sortBy = (document.getElementById('wl-sort') || {}).value || 'added_desc';

 savedGrid.innerHTML = '';

 if (savedSeries.length === 0) {
    savedGrid.innerHTML = '<p style="color: var(--grey);">No bookmarked anime series saved yet.</p>';
    return;
 }

 Promise.all(savedSeries.map(item => fetchFromJikan(`/anime/${item.id}`).then(r => ({ saved: item, data: r && r.data ? r.data : null })).catch(() => ({ saved: item, data: null }))))
    .then(results => {
     const merged = results.map(r => {
        const saved = r.saved;
        const d = r.data;
        return {
         mal_id: saved.id,
         title: saved.title,
         title_japanese: saved.title_japanese || saved.title,
         score: d ? d.score : null,
         images: { jpg: { large_image_url: saved.img } },
         episodes: d ? d.episodes : null,
         airedFrom: d && d.aired && d.aired.from ? new Date(d.aired.from) : null,
         addedAt: saved.addedAt || 0
        };
     });

     const filtered = merged.filter(item => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (item.title && item.title.toLowerCase().includes(q)) || (item.title_japanese && item.title_japanese.toLowerCase().includes(q));
     });

     filtered.sort((a, b) => {
        switch (sortBy) {
         case 'rating_desc': return (b.score || 0) - (a.score || 0);
         case 'rating_asc': return (a.score || 0) - (b.score || 0);
         case 'release_desc': return (b.airedFrom ? b.airedFrom.getTime() : 0) - (a.airedFrom ? a.airedFrom.getTime() : 0);
         case 'episodes_desc': return (b.episodes || 0) - (a.episodes || 0);
         case 'added_desc':
         default:
            return (b.addedAt || 0) - (a.addedAt || 0);
        }
     });

     if (filtered.length === 0) {
        savedGrid.innerHTML = '<p style="color: var(--grey);">No saved titles match your search.</p>';
        return;
     }

     filtered.forEach(item => savedGrid.appendChild(createAnimeCard(item)));
    });
}

function renderContinueWatching() {
 const continueGrid = document.getElementById('continue-watching-grid');
 const continueItems = JSON.parse(localStorage.getItem('continueWatching')) || [];
 continueGrid.innerHTML = '';
 if (continueItems.length === 0) {
  continueGrid.innerHTML = '<p style="color: var(--grey);">No continue watching items yet.</p>';
  return;
 }
 continueItems.forEach((item, index) => {
  const card = document.createElement('div');
  card.className = 'anime-card';
  const posterImage = item.image ? `<img src="${item.image}" alt="${item.title || 'Continue watching'}">` : '<div style="height:260px;background:#111;"></div>';
  const lastEpisode = item.episode || 1;
  const episodeLabel = item.episodeName ? item.episodeName : `Episode ${lastEpisode}`;
  const title = item.title || 'Untitled Anime';

  card.innerHTML = `
            <div style="position: relative; height: 260px;">
                ${posterImage}
                <button class="remove-continue-btn" data-index="${index}" type="button" title="Remove from continue watching">🗑</button>
                <span class="continue-pill">Last watched • Ep ${lastEpisode}</span>
            </div>
            <div class="info">
                <h3>${title}</h3>
                <span>${episodeLabel}</span>
            </div>
        `;
  card.onclick = () => window.location.href = `watch.html?animeId=${item.animeId}&ep=${lastEpisode}`;

  const removeButton = card.querySelector('.remove-continue-btn');
  if (removeButton) {
   removeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    removeContinueWatching(e.currentTarget.dataset.index);
   });
  }

  continueGrid.appendChild(card);
 });
}

function removeContinueWatching(index) {
 let continueItems = JSON.parse(localStorage.getItem('continueWatching')) || [];
 continueItems.splice(index, 1);
 localStorage.setItem('continueWatching', JSON.stringify(continueItems));
 renderContinueWatching();
}

function renderPinnedEpisodes() {
 const pinGrid = document.getElementById('pinned-episodes-grid');
 const pinnedItems = JSON.parse(localStorage.getItem('pinnedEpisodes')) || [];
 pinGrid.innerHTML = '';

 if (pinnedItems.length === 0) {
  pinGrid.innerHTML = '<p style="color: var(--grey);">No pinned episode progress indicators detected.</p>';
  return;
 }

 pinnedItems.forEach((pin, index) => {
  const card = document.createElement('div');
  card.className = 'pin-card no-poster';

  card.innerHTML = `
            <div class="pin-card-content">
                <h4 onclick="window.location.href='watch.html?animeId=${pin.animeId}&ep=${pin.episode}'">${pin.title}</h4>
                <p>Episode ${pin.episode}</p>
            </div>
            <div class="pin-card-actions">
                <button class="icon-btn play-btn" title="Resume" onclick="window.location.href='watch.html?animeId=${pin.animeId}&ep=${pin.episode}'">▶</button>
                <button class="icon-btn delete-btn" title="Delete" data-index="${index}">🗑</button>
            </div>
        `;

  card.querySelector('.delete-btn').onclick = (e) => {
   const pinIdx = e.target.dataset.index;
   removePinnedEpisode(pinIdx);
  };

  pinGrid.appendChild(card);
 });
}

function removePinnedEpisode(index) {
 let pinnedItems = JSON.parse(localStorage.getItem('pinnedEpisodes')) || [];
 pinnedItems.splice(index, 1);
 localStorage.setItem('pinnedEpisodes', JSON.stringify(pinnedItems));
 renderPinnedEpisodes();
}