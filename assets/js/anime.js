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

    // External link parsing
    let malId = anime.mal_id || anime.malId || null;
    let anilistId = anime.anilist_id || anime.anilistId || null;
    if (Array.isArray(anime.external_links)) {
      anime.external_links.forEach(link => {
        if (!malId && link && link.url && /myanimelist\.net/i.test(link.url)) {
          const m = link.url.match(/myanimelist\.net\/anime\/(\d+)/i);
          if (m) malId = m[1];
        }
        if (!anilistId && link && link.url && /anilist\.co/i.test(link.url)) {
          const m = link.url.match(/anilist\.co\/anime\/(\d+)/i);
          if (m) anilistId = m[1];
        }
      });
    }

    const posterImageSrc = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';

    // Metadata details
    const seasonYear = (anime.season && anime.year) 
        ? `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}` 
        : (anime.season || anime.year || 'N/A');
    const status = anime.status || 'N/A';
    const rating = anime.rating ? anime.rating.split(' ')[0] : 'N/A';
    const animeType = anime.type || 'TV';
    
    // Broadcast & local time formatting
    const localBroadcastStr = formatLocalBroadcast(anime.broadcast);

    const posterColumnHtml = `
        <div class="poster-column">
            <div class="poster-container">
                ${posterImageSrc ? `<img class="details-poster" src="${posterImageSrc}" alt="${cleanTitle}">` : ''}
                <div class="poster-actions">
                    ${malId ? `<a class="poster-action" href="https://myanimelist.net/anime/${malId}" target="_blank" rel="noopener noreferrer">MAL</a>` : ''}
                    ${anilistId ? `<a class="poster-action" href="https://anilist.co/anime/${anilistId}" target="_blank" rel="noopener noreferrer">AL</a>` : ''}
                </div>
                <div class="poster-type-tag">${animeType}</div>
            </div>
            
            <div class="meta-badges-list">
                <div class="meta-badge" title="Episodes">
                    <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
                    <span class="meta-badge-span">${anime.episodes || 'TBD'} Episodes</span>
                </div>
                <div class="meta-badge" title="Score">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span class="meta-badge-span">Score: ★ ${anime.score || 'N/A'}</span>
                </div>
                <div class="meta-badge" title="Season">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span class="meta-badge-span">${seasonYear}</span>
                </div>
                <div class="meta-badge" title="Status">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span class="meta-badge-span">${status}</span>
                </div>
                <div class="meta-badge" title="Rating">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span class="meta-badge-span">Rating: ${rating}</span>
                </div>
            </div>
        </div>
    `;

    detailsContainer.innerHTML = `
        ${posterColumnHtml}
        <div class="details-info">
            <h1 style="font-size: 1.85rem; margin-bottom: 4px;">${cleanTitle}</h1>
            <p style="margin-bottom: 14px; opacity: 0.7; font-size: 0.88rem;">${anime.title_japanese || ''}</p>
            <p style="margin-bottom: 14px; line-height: 1.6; font-size: 0.94rem;">${cleanedSynopsis}</p>
            
            ${(localBroadcastStr && status === 'Currently Airing') ? `
            <div class="broadcast-card">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <div><strong>Airs:</strong> ${localBroadcastStr}</div>
            </div>
        ` : ''}
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
 }
});

function formatLocalBroadcast(broadcast) {
 if (!broadcast || !broadcast.day || !broadcast.time || !broadcast.timezone) return null;

 const daysOfWeek = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
 const dayIndex = daysOfWeek.findIndex(d => d.toLowerCase() === broadcast.day.toLowerCase());
 if (dayIndex === -1) return null;

 const [hours, minutes] = broadcast.time.split(':').map(Number);
 if (isNaN(hours) || isNaN(minutes)) return null;

 try {
  const refDate = new Date();
  const currentDay = refDate.getDay();
  let diff = dayIndex - currentDay;
  refDate.setDate(refDate.getDate() + diff);

  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  const padH = String(hours).padStart(2, '0');
  const padM = String(minutes).padStart(2, '0');

  const targetIso = `${year}-${month}-${day}T${padH}:${padM}:00`;
  const jstDate = new Date(new Date(targetIso).toLocaleString('en-US', { timeZone: broadcast.timezone }));
  const utcDate = new Date(new Date(targetIso).getTime() - (jstDate.getTime() - new Date(targetIso).getTime()));

  const localDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(utcDate);
  const localTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(utcDate);

  return `${localDay}s at ${localTime}`;
 } catch (e) {
  return null;
 }
}

function getEpisodeTitle(ep, lang) {
 if (!ep) return '';
 if (lang === 'JP') return ep.title_romanji || ep.title_japanese || ep.title || '';
 return ep.title || ep.title_english || ep.title_japanese || '';
}