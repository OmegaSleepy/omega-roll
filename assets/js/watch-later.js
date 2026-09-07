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
 const query = (document.getElementById('wl-search') || {}).value || '';
 const sortBy = (document.getElementById('wl-sort') || {}).value || 'added_desc';

 savedGrid.innerHTML = '';

 if (savedSeries.length === 0) {
    savedGrid.innerHTML = '<p style="color: var(--grey);">No bookmarked anime series saved yet.</p>';
    return;
 }

 Promise.all(savedSeries.map(item => fetchFromTenrai(`/anime/${item.id}`).then(r => ({ saved: item, data: r && r.data ? r.data : null })).catch(() => ({ saved: item, data: null }))))
    .then(results => {
     const merged = results.map(r => {
        const saved = r.saved;
        const d = r.data;
        return {
         mal_id: saved.id,
         title: saved.title,
         title_english: d ? d.title_english : saved.title,
         title_japanese: saved.title_japanese || saved.title,
         score: d ? d.score : null,
         image_url: saved.img,
         images: { jpg: { image_url: saved.img } },
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
         case 'rating_asc': return (a.score || 0) - (a.score || 0);
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
  
  card.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s ease, border-color 0.2s ease;
      cursor: pointer;
  `;

  const lastEpisode = item.episode || 1;
  const title = item.title || 'Untitled Anime';
  const imageUrl = item.image || '';

  card.innerHTML = `
      <div style="width: 100%; aspect-ratio: 2/3; overflow: hidden; background: #000; position: relative;">
          <img src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
          <button class="remove-continue-btn" data-index="${index}" type="button" title="Remove from continue watching">🗑</button>
      </div>
      <div style="padding: 12px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; gap: 8px;">
          <h4 style="font-size: 0.9rem; font-weight: 600; line-height: 1.3; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.6em; color: #fff;" title="${title}">
              ${title}
          </h4>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #8b949e; margin-top: auto; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; color: #fff;">Ep ${lastEpisode}</span>
              <span>Last watched</span>
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

  card.onclick = (e) => {
      if (e.target.classList.contains('remove-continue-btn')) return;
      window.location.href = `${window.resolveSitePath('/pages/watch.html')}?animeId=${item.animeId}&ep=${lastEpisode}`;
  };

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
                <h4 onclick="window.location.href='${window.resolveSitePath('/pages/watch.html')}?animeId=${pin.animeId}&ep=${pin.episode}'">${pin.title}</h4>
                <p>Episode ${pin.episode}</p>
            </div>
            <div class="pin-card-actions">
                <button class="icon-btn play-btn" title="Resume" onclick="window.location.href='${window.resolveSitePath('/pages/watch.html')}?animeId=${pin.animeId}&ep=${pin.episode}'">▶</button>
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