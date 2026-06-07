document.addEventListener("DOMContentLoaded", async () => {
 const searchInput = document.getElementById('search-input');
 const searchBtn = document.getElementById('search-btn');
 const genreSelect = document.getElementById('search-genre');
 const typeSelect = document.getElementById('search-type');
 const excludeMusicCheckbox = document.getElementById('exclude-music');
 const statusSelect = document.getElementById('search-status');
 const ratingSelect = document.getElementById('search-rating');
 const orderSelect = document.getElementById('search-order');
 const sortSelect = document.getElementById('search-sort');
 const minScoreInput = document.getElementById('search-min-score');
 const searchResults = document.getElementById('search-results');

 async function populateGenreOptions() {
  const genreData = await fetchFromJikan('/genres/anime');
  if (genreData && genreData.data) {
   genreData.data.slice(0, 25).forEach(genre => {
    const opt = document.createElement('option');
    opt.value = genre.mal_id;
    opt.innerText = genre.name;
    genreSelect.appendChild(opt);
   });
  }
 }

 async function performSearch() {
  const query = searchInput.value.trim();
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (genreSelect.value) params.set('genres', genreSelect.value);
  if (typeSelect.value) params.set('type', typeSelect.value);
  if (statusSelect.value) params.set('status', statusSelect.value);
  if (ratingSelect.value) params.set('rating', ratingSelect.value);
  if (minScoreInput.value) params.set('min_score', minScoreInput.value);
  params.set('order_by', orderSelect.value);
  params.set('sort', sortSelect.value);
  params.set('limit', '24');

  const excludeMusic = excludeMusicCheckbox.checked;
  if (!query && !genreSelect.value && !typeSelect.value && !statusSelect.value && !ratingSelect.value && !minScoreInput.value && !excludeMusic) {
   searchResults.innerHTML = '<p style="color: var(--neon-green)">Enter a title or select filters to search.</p>';
   return;
  }

  searchResults.innerHTML = '<p style="color: var(--neon-green)">Searching database...</p>';
  const data = await fetchFromJikan(`/anime?${params.toString()}`);

  searchResults.innerHTML = ''; // Clear status text
    if (data && data.data && data.data.length > 0) {
     const seenIds = new Set();
     data.data.forEach(anime => {
      if (!anime) return;
      if (excludeMusic && anime.type && String(anime.type).toLowerCase() === 'music') return;
      if (seenIds.has(anime.mal_id)) return;
      seenIds.add(anime.mal_id);
      const card = createAnimeCard(anime);
      if (card) searchResults.appendChild(card);
     });
   if (!searchResults.childElementCount) {
    searchResults.innerHTML = '<p>No anime found matching your filters.</p>';
   }
  } else {
   searchResults.innerHTML = '<p>No anime found matching your query.</p>';
  }
 }

 searchBtn.onclick = performSearch;
 searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
 await populateGenreOptions();
});