document.addEventListener("DOMContentLoaded", async () => {
 const params = new URLSearchParams(window.location.search);
 const animeId = params.get('id');

 if (!animeId) {
  window.location.href = 'index.html';
  return;
 }

 const detailsContainer = document.getElementById('anime-details');
 const episodeListContainer = document.getElementById('episode-list');

 // 1. Fetch Anime Metadata
 const animeData = await fetchFromJikan(`/anime/${animeId}`);
 if (animeData && animeData.data) {
    const anime = animeData.data;
    const lang = localStorage.getItem('globalLanguage') || 'EN';
    let chosenTitle = anime.title;
    if (lang === 'JP' && anime.title_japanese) chosenTitle = anime.title_japanese;
    else if (lang === 'EN' && anime.title_english) chosenTitle = anime.title_english;
    const { cleanTitle } = parseSeasonFromTitle(chosenTitle);
  document.title = `${cleanTitle} - Omega-Roll`;
       const cleanedSynopsis = (anime.synopsis || 'No synopsis available.').replace(/\s*\[Written by MAL Rewrite\]\s*$/i, '');
       // Improved details UI
       const genres = (anime.genres || []).map(g => `<span class="genre-badge" style="margin-right:6px; padding:4px 8px; background:#0d0d0d; border:1px solid #222; border-radius:12px; font-size:12px;">${g.name}</span>`).join(' ');

       detailsContainer.innerHTML = `
                        <img class="details-poster" src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
                        <div class="details-info">
                                <h1 style="color:var(--neon-green); margin-bottom:6px;">${cleanTitle}</h1>
                                <p style="margin: 6px 0 12px 0; color: var(--grey); font-style: italic;">${anime.title_japanese || ''} ${anime.title_english ? '• ' + anime.title_english : ''}</p>
                                <div style="margin-bottom:12px;">${genres}</div>
                                <p style="margin-bottom: 14px; line-height:1.6;">${cleanedSynopsis}</p>
                                <a class="mal-link" href="https://myanimelist.net/anime/${anime.mal_id}/" target="_blank" rel="noopener noreferrer">View this anime on MyAnimeList</a>
                                <div style="display:flex; gap:18px; flex-wrap:wrap; align-items:center; margin-top:16px;">
                                    <div><strong>Type:</strong> ${anime.type || 'Unknown'}</div>
                                    <div><strong>Episodes:</strong> ${anime.episodes || 'TBD'}</div>
                                    <div><strong>Score:</strong> ★ ${anime.score || 'N/A'}</div>
                                    <div><strong>Status:</strong> ${anime.status || 'Unknown'}</div>
                                </div>
                        </div>
                `;

    // 2. Fetch released episodes list from API and render released episodes with "See more" support
    let episodesPage = 1;
    let episodesData = [];
    let episodesResp = await fetchFromJikan(`/anime/${animeId}/episodes?page=${episodesPage}`);
    if (episodesResp && episodesResp.data && Array.isArray(episodesResp.data) && episodesResp.data.length > 0) {
     episodesData = episodesResp.data;
    }

    const appendEpisodes = (list) => {
     list.forEach(ep => {
        const epNumber = ep.episode || ep.mal_id || null;
        if (!epNumber) return;
        const aired = ep.aired ? new Date(ep.aired) : null;
        const released = aired && (!isNaN(aired.getTime())) && aired <= new Date();
        if (!released) return; // do not display unreleased
        const li = document.createElement('li');
        li.className = 'episode-item';
        const episodeName = getEpisodeTitle(ep, lang);
        const titleLabel = episodeName ? `Episode ${epNumber}: ${episodeName}` : `Episode ${epNumber}`;
        const hasDub = ep.title && /dub/i.test(ep.title);
        const hasSub = ep.title && /sub/i.test(ep.title);
        const badges = [];
        if (hasSub) badges.push('<small style="color:#a7ffb8; margin-right:6px;">SUB</small>');
        if (hasDub) badges.push('<small style="color:#ffd3a7;">DUB</small>');
        li.innerHTML = `<a href="watch.html?animeId=${animeId}&ep=${epNumber}" title="${titleLabel}">${titleLabel} ${badges.join(' ')}</a>`;
        episodeListContainer.appendChild(li);
     });
    };

    // initially append data
    if (episodesData.length > 0) {
     appendEpisodes(episodesData);
    } else {
     // fallback: numeric list
     const releasedCount = anime.episodes || 0;
     for (let i = 1; i <= releasedCount; i++) {
        const li = document.createElement('li');
        li.className = 'episode-item';
        li.innerHTML = `<a href="watch.html?animeId=${animeId}&ep=${i}" title="Episode ${i}">Episode ${i}</a>`;
        episodeListContainer.appendChild(li);
     }
    }

    // If API has more pages, show a "See more" button to fetch additional pages lazily
    const showSeeMoreIfNeeded = (resp) => {
     try {
      if (resp && resp.pagination && resp.pagination.has_next_page) {
       const btn = document.createElement('button');
       btn.className = 'btn';
       btn.style.display = 'block';
       btn.style.margin = '12px auto';
       btn.textContent = 'See more episodes';
       let loading = false;
       btn.onclick = async () => {
        if (loading) return;
        loading = true;
        btn.textContent = 'Loading...';
        episodesPage += 1;
        const nextResp = await fetchFromJikan(`/anime/${animeId}/episodes?page=${episodesPage}`);
        if (nextResp && Array.isArray(nextResp.data) && nextResp.data.length > 0) {
         appendEpisodes(nextResp.data);
        }
        if (!(nextResp && nextResp.pagination && nextResp.pagination.has_next_page)) {
         btn.remove();
        } else {
         btn.textContent = 'See more episodes';
        }
        loading = false;
       };
       episodeListContainer.parentNode.insertBefore(btn, episodeListContainer.nextSibling);
      }
     } catch (e) {
      // silent
     }
    };

    showSeeMoreIfNeeded(episodesResp);

   const recommendationsContainer = document.getElementById('recommendations-section');
   if (recommendationsContainer) {
    // Rate-limit mitigation: wait a short delay before fetching recommendations and retry once on failure
    const RECOMMENDATION_DELAY_MS = 1200;
    const fetchWithDelay = async (endpoint, attempts = 2, baseDelay = RECOMMENDATION_DELAY_MS) => {
     for (let i = 0; i < attempts; i++) {
      // initial wait before first attempt as well
      await new Promise(r => setTimeout(r, baseDelay * (i === 0 ? 1 : 2 ** (i - 1))));
      const resp = await fetchFromJikan(endpoint);
      if (resp) return resp;
     }
     return null;
    };

    const recsResp = await fetchWithDelay(`/anime/${animeId}/recommendations`);
    const recommendations = recsResp && recsResp.data ? recsResp.data : [];
     const recommendationsSection = renderRecommendations(recommendations);
     recommendationsContainer.appendChild(recommendationsSection);
      // Add "More of X" panel: search for the clean title and show up to 8 related results
      try {
       const searchResp = await fetchWithDelay(`/anime?q=${encodeURIComponent(cleanTitle)}&limit=8`);
       const results = searchResp && searchResp.data ? searchResp.data : [];
       const filteredResults = Array.isArray(results)
         ? results.filter(item => {
             if (!item) return false;
             if (item.type && String(item.type).toLowerCase() === 'music') return false;
             return String(item.mal_id) !== String(animeId);
           })
         : [];
       if (filteredResults.length > 0) {
        const moreSection = document.createElement('div');
        moreSection.className = 'section-panel';
        const h = document.createElement('h2');
        h.textContent = `More of ${cleanTitle}`;
        moreSection.appendChild(h);
        const grid = document.createElement('div');
        grid.className = 'anime-grid';
        filteredResults.forEach(item => {
         try {
          grid.appendChild(createAnimeCard(item));
         } catch (err) {
          console.warn('MoreOf render failed for', item, err);
         }
        });
        moreSection.appendChild(grid);
        recommendationsContainer.appendChild(moreSection);
       }
      } catch (e) {
       // ignore search errors
      }
    }
 } else {
  detailsContainer.innerHTML = '<p>Error loading metadata for this anime.</p>';
 }
});

function getEpisodeTitle(ep, lang) {
 if (!ep) return '';
 if (lang === 'JP') {
  return ep.title_romanji || ep.title_japanese || ep.title || '';
 }
 return ep.title || ep.title_english || ep.title_japanese || '';
}

function renderRecommendations(recommendations) {
 const section = document.createElement('div');
 section.className = 'section-panel';
 const heading = document.createElement('h2');
 heading.textContent = 'Recommendations';
 section.appendChild(heading);

 if (!Array.isArray(recommendations) || recommendations.length === 0) {
  const emptyMessage = document.createElement('p');
  emptyMessage.style.color = 'var(--grey)';
  emptyMessage.textContent = 'No recommendations available at this time.';
  section.appendChild(emptyMessage);
  return section;
 }

 const grid = document.createElement('div');
 grid.className = 'anime-grid';
 const filteredRecommendations = recommendations.filter(rec => {
  const entry = rec.entry || rec;
  return entry && !(entry.type && String(entry.type).toLowerCase() === 'music');
 });
 filteredRecommendations.slice(0, 8).forEach(rec => {
  const entry = rec.entry || rec;
  if (!entry) return;
  if (!entry.mal_id && entry.url) {
   const malMatch = String(entry.url).match(/mal\.php\?id=(\d+)|anime\/(\d+)/i);
   if (malMatch) entry.mal_id = malMatch[1] || malMatch[2];
  }
  try {
   grid.appendChild(createAnimeCard(entry));
  } catch (error) {
   console.warn('Recommendation render failed for entry:', entry, error);
  }
 });
 section.appendChild(grid);
 return section;
}

function getMALIdFromUrl(url) {
 const match = String(url).match(/mal\.php\?id=(\d+)|anime\/(\d+)/i);
 return match ? (match[1] || match[2]) : null;
}
