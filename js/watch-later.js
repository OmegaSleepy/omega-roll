document.addEventListener("DOMContentLoaded", () => {
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

 // Fetch details for each saved item so ratings, episodes and release date are accurate
 Promise.all(savedSeries.map(item => fetchFromJikan(`/anime/${item.id}`).then(r => ({ saved: item, data: r && r.data ? r.data : null })).catch(() => ({ saved: item, data: null }))))
    .then(results => {
     // Merge saved info with remote details
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

     // Filter by search query
     const filtered = merged.filter(item => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (item.title && item.title.toLowerCase().includes(q)) || (item.title_japanese && item.title_japanese.toLowerCase().includes(q));
     });

     // Sort
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
  card.className = 'pin-card';

  // Convert video timestamps cleanly to minutes/seconds format structures
  const mins = Math.floor(pin.timestamp / 60);
  const secs = Math.floor(pin.timestamp % 60).toString().padStart(2, '0');

  card.innerHTML = `
            <div>
                <h4 style="cursor:pointer;" onclick="window.location.href='watch.html?animeId=${pin.animeId}&ep=${pin.episode}'">${pin.title}</h4>
                <p>Episode ${pin.episode} • Stopped at ${mins}:${secs}</p>
            </div>
            <div style="display:flex; justify-content: space-between; align-items:center; width:100%;">
                <button class="btn" style="padding: 6px 14px; font-size:12px;" onclick="window.location.href='watch.html?animeId=${pin.animeId}&ep=${pin.episode}'">▶ Resume</button>
                <button class="remove-btn" data-index="${index}">Delete</button>
            </div>
        `;

  card.querySelector('.remove-btn').onclick = (e) => {
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
 renderPinnedEpisodes(); // Live local layout refresh
}