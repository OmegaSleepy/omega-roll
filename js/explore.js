document.addEventListener("DOMContentLoaded", async () => {
 const exploreGrid = document.getElementById('explore-grid');

 // Infinite scroll / paged fetch
 let currentPage = 1;
 const LIMIT = 24;
 let loading = false;

 async function loadPage(page) {
  loading = true;
  const data = await fetchFromJikan(`/top/anime?limit=${LIMIT}&page=${page}`);
  if (data && data.data && data.data.length > 0) {
   data.data.forEach(anime => {
    exploreGrid.appendChild(createAnimeCard(anime));
   });
   loading = false;
   return true;
  }
  loading = false;
  return false;
 }

 // initial load
 await loadPage(currentPage);

 // on scroll, when near bottom, load next page
 window.addEventListener('scroll', async () => {
  if (loading) return;
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 800)) {
   currentPage++;
   await loadPage(currentPage);
  }
 });
});