document.addEventListener("DOMContentLoaded", async () => {
 const genresContainer = document.getElementById('genres-container');
 const resultGrid = document.getElementById('genre-anime-grid');
 const resultTitle = document.getElementById('genre-result-title');
 const searchInput = document.getElementById('genre-search');

 const GENRE_LIMIT = 18;
 let currentGenreId = null;
 let currentGenrePage = 1;
 let genreLoading = false;
 const seenGenreIds = new Set();
 let allGenres = [];

 // Fetch official categories directly from Tenrai endpoints
 const genreData = await fetchFromTenrai('/genres/anime');

 if (!genreData || !genreData.data) {
  genresContainer.innerText = "Failed loading categories.";
  return;
 }

 allGenres = genreData.data;
 renderGenres(allGenres.slice(0, 30));

 searchInput?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allGenres.filter(g => g.name.toLowerCase().includes(query));
  renderGenres(filtered);
 });

 function renderGenres(genresList) {
  const fragment = document.createDocumentFragment();
  genresContainer.innerHTML = '';

  genresList.forEach(genre => {
   const pill = document.createElement('button');
   pill.className = 'genre-pill';
   if (genre.mal_id === currentGenreId) pill.classList.add('active');
   pill.innerText = genre.name;
   pill.onclick = () => loadAnimeByGenre(genre.mal_id, genre.name, pill);
   fragment.appendChild(pill);
  });

  genresContainer.appendChild(fragment);
 }

 async function loadAnimeByGenre(genreId, genreName, clickedPill) {
  if (currentGenreId === genreId && genreLoading) return;

  document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
  clickedPill.classList.add('active');

  resultTitle.innerText = `Top Anime Category: ${genreName}`;
  resultGrid.innerHTML = '<div class="loading-state">Loading database items...</div>';

  currentGenreId = genreId;
  currentGenrePage = 1;
  seenGenreIds.clear();

  const success = await loadGenrePage(currentGenreId, currentGenrePage);
  if (!success) {
   resultGrid.innerHTML = '<p>No items found for this category.</p>';
  }
 }

 async function loadGenrePage(genreId, page) {
  if (genreLoading) return false;
  genreLoading = true;

  try {
   const response = await fetchFromTenrai(`/anime?genres=${genreId}&order_by=score&sort=desc&limit=${GENRE_LIMIT}&page=${page}`);
   
   if (page === 1) resultGrid.innerHTML = '';

   if (response && response.data && response.data.length > 0) {
    const fragment = document.createDocumentFragment();
    response.data.forEach(anime => {
     if (!isValidAnime(anime) || seenGenreIds.has(anime.mal_id)) return;
     seenGenreIds.add(anime.mal_id);
     fragment.appendChild(createAnimeCard(anime));
    });
    resultGrid.appendChild(fragment);
    return true;
   }
  } finally {
   genreLoading = false;
  }
  return false;
 }

 window.addEventListener('scroll', async () => {
  if (!currentGenreId || genreLoading) return;
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 800)) {
   currentGenrePage++;
   await loadGenrePage(currentGenreId, currentGenrePage);
  }
 });
});