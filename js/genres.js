document.addEventListener("DOMContentLoaded", async () => {
 const genresContainer = document.getElementById('genres-container');
 const resultGrid = document.getElementById('genre-anime-grid');
 const resultTitle = document.getElementById('genre-result-title');

 // Fetch official categories directly from Jikan endpoints
 const genreData = await fetchFromJikan('/genres/anime');

 if (!genreData || !genreData.data) {
  genresContainer.innerText = "Failed loading categories.";
  return;
 }

 genresContainer.innerHTML = '';
 // Display the top 25 categories for clean spacing layout
 genreData.data.slice(0, 25).forEach(genre => {
  const pill = document.createElement('button');
  pill.className = 'genre-pill';
  pill.innerText = genre.name;
  pill.onclick = () => loadAnimeByGenre(genre.mal_id, genre.name, pill);
  genresContainer.appendChild(pill);
 });

 let currentGenreId = null;
 let currentGenrePage = 1;
 const GENRE_LIMIT = 18;
 let genreLoading = false;

 async function loadAnimeByGenre(genreId, genreName, clickedPill) {
  document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
  clickedPill.classList.add('active');

  resultTitle.innerText = `Top Anime Category: ${genreName}`;
  resultGrid.innerHTML = '<p style="color: var(--neon-green)">Loading database items...</p>';

  // reset paging state
  currentGenreId = genreId;
  currentGenrePage = 1;
  resultGrid.innerHTML = '';

  await loadGenrePage(currentGenreId, currentGenrePage);
 }

 async function loadGenrePage(genreId, page) {
  if (genreLoading) return false;
  genreLoading = true;
  const response = await fetchFromJikan(`/anime?genres=${genreId}&order_by=score&sort=desc&limit=${GENRE_LIMIT}&page=${page}`);
  genreLoading = false;
  if (response && response.data && response.data.length > 0) {
   response.data.forEach(anime => resultGrid.appendChild(createAnimeCard(anime)));
   return true;
  }
  return false;
 }

 // Scroll handler for infinite loading when a genre is active
 window.addEventListener('scroll', async () => {
  if (!currentGenreId || genreLoading) return;
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 800)) {
   currentGenrePage++;
   await loadGenrePage(currentGenreId, currentGenrePage);
  }
 });
});