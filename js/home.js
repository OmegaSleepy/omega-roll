document.addEventListener("DOMContentLoaded", async () => {
 const trendingGrid = document.getElementById('trending-grid');

 // Fetch seasonal streaming anime from Jikan
 const data = await fetchFromJikan('/seasons/now?limit=12');

 if (data && data.data) {
  data.data.forEach(anime => {
   const card = createAnimeCard(anime);
   trendingGrid.appendChild(card);
  });
 } else {
  trendingGrid.innerHTML = '<p>Failed to load trending content. Please refresh.</p>';
 }
});

// Export user profile variables configuration states seamlessly
document.getElementById('export-data-btn').onclick = () => {
 const exportPayload = {
  watchLater: JSON.parse(localStorage.getItem('watchLater')) || [],
  pinnedEpisodes: JSON.parse(localStorage.getItem('pinnedEpisodes')) || []
 };

 const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload));
 const downloadAnchor = document.createElement('a');
 downloadAnchor.setAttribute("href", dataStr);
 downloadAnchor.setAttribute("download", "crunchyneon_profile.json");
 document.body.appendChild(downloadAnchor);
 downloadAnchor.click();
 downloadAnchor.remove();
};

// Import tracking backup items parsing loops execution
document.getElementById('import-data-file').onchange = (e) => {
 const fileReader = new FileReader();
 fileReader.onload = function(event) {
  try {
   const importedData = JSON.parse(event.target.result);
   if (importedData.watchLater) localStorage.setItem('watchLater', JSON.stringify(importedData.watchLater));
   if (importedData.pinnedEpisodes) localStorage.setItem('pinnedEpisodes', JSON.stringify(importedData.pinnedEpisodes));

   alert('Profile configuration settings successfully updated! Reloading dashboard items...');
   window.location.reload();
  } catch (error) {
   alert('Invalid profile system backup document file layout format parsed.');
  }
 };
 if(e.target.files[0]) fileReader.readAsText(e.target.files[0]);
};