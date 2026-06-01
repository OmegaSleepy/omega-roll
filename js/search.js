document.addEventListener("DOMContentLoaded", () => {
 const searchInput = document.getElementById('search-input');
 const searchBtn = document.getElementById('search-btn');
 const searchResults = document.getElementById('search-results');

 async function performSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  searchResults.innerHTML = '<p style="color: var(--neon-green)">Searching database...</p>';

  const data = await fetchFromJikan(`/anime?q=${encodeURIComponent(query)}&limit=20`);

  searchResults.innerHTML = ''; // Clear status text
  if (data && data.data && data.data.length > 0) {
   data.data.forEach(anime => {
    const card = createAnimeCard(anime);
    searchResults.appendChild(card);
   });
  } else {
   searchResults.innerHTML = '<p>No anime found matching your query.</p>';
  }
 }

 searchBtn.onclick = performSearch;
 searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
});