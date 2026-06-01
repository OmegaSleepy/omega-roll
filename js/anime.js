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
    // Improved details UI
    const genres = (anime.genres || []).map(g => `<span class="genre-badge" style="margin-right:6px; padding:4px 8px; background:#0d0d0d; border:1px solid #222; border-radius:12px; font-size:12px;">${g.name}</span>`).join(' ');

    detailsContainer.innerHTML = `
                        <img class="details-poster" src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
                        <div class="details-info">
                                <h1 style="color:var(--neon-green); margin-bottom:6px;">${cleanTitle}</h1>
                                <p style="margin: 6px 0 12px 0; color: var(--grey); font-style: italic;">${anime.title_japanese || ''} ${anime.title_english ? '• ' + anime.title_english : ''}</p>
                                <div style="margin-bottom:12px;">${genres}</div>
                                <p style="margin-bottom: 14px; line-height:1.6;">${anime.synopsis || 'No synopsis available.'}</p>
                                <div style="display:flex; gap:18px; flex-wrap:wrap; align-items:center;">
                                    <div><strong>Type:</strong> ${anime.type || 'Unknown'}</div>
                                    <div><strong>Episodes:</strong> ${anime.episodes || 'TBD'}</div>
                                    <div><strong>Score:</strong> ★ ${anime.score || 'N/A'}</div>
                                    <div><strong>Status:</strong> ${anime.status || 'Unknown'}</div>
                                </div>
                        </div>
                `;

    // 2. Fetch released episodes list from API and only render released episodes
    const episodesResp = await fetchFromJikan(`/anime/${animeId}/episodes`);
    let releasedCount = 0;
    let episodesData = [];
    if (episodesResp && episodesResp.data && Array.isArray(episodesResp.data) && episodesResp.data.length > 0) {
     episodesData = episodesResp.data;
     releasedCount = episodesData.length;
    } else {
     releasedCount = anime.episodes || 0;
    }

    // Render only released episodes (from episodesData) if available; otherwise fallback to numeric list
    if (episodesData.length > 0) {
     episodesData.forEach(ep => {
        // ep may include ep.episode (number) or we infer order
        const epNumber = ep.episode || ep.mal_id || null;
        if (!epNumber) return;
        const li = document.createElement('li');
        li.className = 'episode-item';
        const aired = ep.aired ? new Date(ep.aired) : null;
        const released = aired && (!isNaN(aired.getTime())) && aired <= new Date();
        if (!released) return; // do not display unreleased
        // detect simple dub/sub cues if present
        const hasDub = ep.title && /dub/i.test(ep.title);
        const hasSub = ep.title && /sub/i.test(ep.title);
        const badges = [];
        if (hasSub) badges.push('<small style="color:#a7ffb8; margin-right:6px;">SUB</small>');
        if (hasDub) badges.push('<small style="color:#ffd3a7;">DUB</small>');
        li.innerHTML = `<a href="watch.html?animeId=${animeId}&ep=${epNumber}">Episode ${epNumber} ${badges.join(' ')}</a>`;
        episodeListContainer.appendChild(li);
     });
    } else {
     // fallback: render numeric list up to releasedCount but only if episodes reported
     for (let i = 1; i <= releasedCount; i++) {
        const li = document.createElement('li');
        li.className = 'episode-item';
        li.innerHTML = `<a href="watch.html?animeId=${animeId}&ep=${i}">Episode ${i}</a>`;
        episodeListContainer.appendChild(li);
     }
    }
 } else {
  detailsContainer.innerHTML = '<p>Error loading metadata for this anime.</p>';
 }
});