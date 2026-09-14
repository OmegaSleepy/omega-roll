document.addEventListener("DOMContentLoaded", async () => {
 const wrapper = document.getElementById('carousel-slide-wrapper');
 const dotsContainer = document.getElementById('carousel-dots');
 const prevBtn = document.getElementById('carousel-prev');
 const nextBtn = document.getElementById('carousel-next');

 let currentIndex = 0;
 let trendingList = [];
 let autoRotateTimer = null;

 // Fetch seasonal streaming anime from Tenrai
 const data = await fetchFromTenrai('/seasons/now?limit=12');

 if (data && data.data && data.data.length > 0) {
  const seenIds = new Set();
  trendingList = data.data.filter(anime => {
   if (seenIds.has(anime.mal_id)) return false;
   seenIds.add(anime.mal_id);
   return true;
  });

  renderCarousel();
  startAutoRotate();
 } else {
  wrapper.innerHTML = '<p style="padding:20px;">Failed to load trending content. Please refresh.</p>';
 }

 function renderCarousel() {
  wrapper.innerHTML = '';
  dotsContainer.innerHTML = '';

  trendingList.forEach((anime, index) => {
   const bgImage = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
   const title = anime.title_english || anime.title || 'Featured Anime';
   const score = anime.score ? `★ ${anime.score}` : 'N/A';
   const episodes = anime.episodes ? `${anime.episodes} EP` : 'Ongoing';
   const synopsis = anime.synopsis ? anime.synopsis.slice(0, 220) + '...' : 'No description available.';
   
   // Target route: /pages/anime.html?id=<id>
   const animeUrl = window.resolveSitePath(`/pages/anime.html?id=${anime.mal_id}`);

   // Build slide
   const slide = document.createElement('div');
   slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
   slide.style.backgroundImage = `linear-gradient(90deg, rgba(5,7,11,0.95) 0%, rgba(5,7,11,0.75) 55%, rgba(5,7,11,0.3) 100%), url('${bgImage}')`;
   
    slide.innerHTML = `
    <div class="hero-details">
      <div class="hero-badges">
      <span class="badge score">${score}</span>
      <span class="badge ep">${episodes}</span>
      <span class="badge tag">TRENDING #${index + 1}</span>
      </div>
      <h1 class="hero-title">${title}</h1>
      <p class="hero-synopsis">${synopsis}</p>
      <div class="hero-actions">
      <a href="${animeUrl}" class="btn" style="text-decoration: none;">▶ Open Listing Page</a>
      </div>
    </div>
    `;
   wrapper.appendChild(slide);

   // Build pagination dot
   const dot = document.createElement('button');
   dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
   dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
   dot.onclick = () => goToSlide(index);
   dotsContainer.appendChild(dot);
  });
 }

 function goToSlide(index) {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  
  if (slides.length === 0) return;

  slides[currentIndex].classList.remove('active');
  dots[currentIndex].classList.remove('active');

  currentIndex = (index + slides.length) % slides.length;

  slides[currentIndex].classList.add('active');
  dots[currentIndex].classList.add('active');

  resetAutoRotate();
 }

 function startAutoRotate() {
  autoRotateTimer = setInterval(() => {
   goToSlide(currentIndex + 1);
  }, 6000);
 }

 function resetAutoRotate() {
  clearInterval(autoRotateTimer);
  startAutoRotate();
 }

 prevBtn.onclick = () => goToSlide(currentIndex - 1);
 nextBtn.onclick = () => goToSlide(currentIndex + 1);
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
 downloadAnchor.setAttribute("download", "omegaroll_profile.json");
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