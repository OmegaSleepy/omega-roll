document.addEventListener("DOMContentLoaded", async () => {
 const params = new URLSearchParams(window.location.search);
 const animeId = params.get('id');

 if (!animeId) {
  window.location.href = window.resolveSitePath('/index.html');
  return;
 }

 const detailsContainer = document.getElementById('anime-details');
 const episodeListContainer = document.getElementById('episode-list');
 const searchInput = document.getElementById('episode-search');

 // Fetch Anime Metadata
 const animeData = await fetchFromTenrai(`/anime/${animeId}`);
 if (animeData && animeData.data) {
    const anime = animeData.data;
    const lang = localStorage.getItem('globalLanguage') || 'EN';
    let chosenTitle = anime.title;
    if (lang === 'JP' && anime.title_japanese) chosenTitle = anime.title_japanese;
    else if (lang === 'EN' && anime.title_english) chosenTitle = anime.title_english;
    const { cleanTitle } = parseSeasonFromTitle(chosenTitle);
    document.title = `${cleanTitle} - Omega-Roll`;
    
    const cleanedSynopsis = (anime.synopsis || 'No synopsis available.').replace(/\s*\[Written by MAL Rewrite\]\s*$/i, '');

    detailsContainer.innerHTML = `
        <img class="details-poster" src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
        <div class="details-info">
            <h1 style="font-size: 1.8rem; margin-bottom: 8px;">${cleanTitle}</h1>
            <p style="margin-bottom: 12px; opacity: 0.8; font-size: 0.9rem;">${anime.title_japanese || ''}</p>
            <p style="margin-bottom: 16px; line-height: 1.5; font-size: 0.9rem;">${cleanedSynopsis}</p>
            <div>
                <span><strong>Type:</strong> ${anime.type || 'Unknown'}</span> | 
                <span><strong>Episodes:</strong> ${anime.episodes || 'TBD'}</span> | 
                <span><strong>Score:</strong> ★ ${anime.score || 'N/A'}</span>
            </div>
        </div>
    `;

    // Fetch and render episode list
    let episodesPage = 1;
    let episodesResp = await fetchFromTenrai(`/anime/${animeId}/episodes?page=${episodesPage}`);
    let episodesData = (episodesResp && Array.isArray(episodesResp.data)) ? episodesResp.data : [];

    const appendEpisodes = (list) => {
     list.forEach(ep => {
        const epNumber = ep.episode || ep.mal_id || null;
        if (!epNumber) return;
        
        const li = document.createElement('li');
        li.className = 'episode-item';
        const episodeName = getEpisodeTitle(ep, lang);
        const titleLabel = episodeName ? `Ep ${epNumber}: ${episodeName}` : `Episode ${epNumber}`;
        
        li.dataset.searchtext = titleLabel.toLowerCase();
        li.innerHTML = `<a href="${window.resolveSitePath('/pages/watch.html')}?animeId=${animeId}&ep=${epNumber}" title="${titleLabel}"><span>${titleLabel}</span></a>`;
        episodeListContainer.appendChild(li);
     });
    };

    if (episodesData.length > 0) {
     appendEpisodes(episodesData);
    } else {
     const releasedCount = anime.episodes || 0;
     for (let i = 1; i <= releasedCount; i++) {
        const li = document.createElement('li');
        li.className = 'episode-item';
        const label = `Episode ${i}`;
        li.dataset.searchtext = label.toLowerCase();
        li.innerHTML = `<a href="${window.resolveSitePath('/pages/watch.html')}?animeId=${animeId}&ep=${i}"><span>${label}</span></a>`;
        episodeListContainer.appendChild(li);
     }
    }

    // Episode Live Search Filter
    if (searchInput) {
     searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = episodeListContainer.querySelectorAll('.episode-item');
      items.forEach(item => {
       const text = item.dataset.searchtext || '';
       if (text.includes(query)) {
        item.style.display = 'block';
       } else {
        item.style.display = 'none';
       }
      });
     });
    }

    // Pagination trigger
    if (episodesResp && episodesResp.pagination && episodesResp.pagination.has_next_page) {
     const container = document.getElementById('load-more-container');
     const btn = document.createElement('button');
     btn.className = 'btn';
     btn.style.width = '100%';
     btn.style.marginTop = '12px';
     btn.textContent = 'Load More';
     btn.onclick = async () => {
      episodesPage += 1;
      const nextResp = await fetchFromTenrai(`/anime/${animeId}/episodes?page=${episodesPage}`);
      if (nextResp && Array.isArray(nextResp.data) && nextResp.data.length > 0) {
       appendEpisodes(nextResp.data);
      }
      if (!(nextResp && nextResp.pagination && nextResp.pagination.has_next_page)) {
       btn.remove();
      }
     };
     container.appendChild(btn);
    }

    // Load recommendations
    const recommendationsContainer = document.getElementById('recommendations-section');
    if (recommendationsContainer) {
     const recsResp = await fetchFromTenrai(`/anime/${animeId}/recommendations`);
     const recommendations = recsResp && recsResp.data ? recsResp.data : [];
     recommendationsContainer.appendChild(renderRecommendations(recommendations));
    }
 }
});

function getEpisodeTitle(ep, lang) {
 if (!ep) return '';
 if (lang === 'JP') return ep.title_romanji || ep.title_japanese || ep.title || '';
 return ep.title || ep.title_english || ep.title_japanese || '';
}

function renderRecommendations(recommendations) {
 const section = document.createElement('div');
 section.style.marginTop = '32px';
 const heading = document.createElement('h3');
 heading.textContent = 'Recommended Titles';
 heading.style.marginBottom = '16px';
 section.appendChild(heading);

 if (!Array.isArray(recommendations) || recommendations.length === 0) {
  const empty = document.createElement('p');
  empty.textContent = 'No recommendations available.';
  section.appendChild(empty);
  return section;
 }

 const grid = document.createElement('div');
 grid.className = 'anime-grid';
 recommendations.slice(0, 6).forEach(rec => {
  const entry = rec.entry || rec;
  if (!entry) return;
  try {
   grid.appendChild(createAnimeCard(entry));
  } catch (e) {}
 });
 section.appendChild(grid);
 return section;
}