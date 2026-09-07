document.addEventListener("DOMContentLoaded", async () => {
 const params = new URLSearchParams(window.location.search);
 const animeId = params.get('animeId');
 let currentEp = parseInt(params.get('ep')) || 1;
 let currentMode = "SUB";
 const storedMode = localStorage.getItem('preferredAudioMode');
 if (storedMode === 'SUB' || storedMode === 'DUB') {
  currentMode = storedMode;
 }

 document.getElementById('back-to-anime').href = `anime.html?id=${animeId}`;

 const videoTitle = document.getElementById('video-title');
 const epPicker = document.getElementById('ep-picker');
 const episodeSearch = document.getElementById('episode-search');
 const episodePickerList = document.getElementById('episode-picker-list');
 const currentEpisodeIndicator = document.getElementById('episode-current-indicator');
 const prevEpisodeBtn = document.getElementById('prev-episode-btn');
 const nextEpisodeBtn = document.getElementById('next-episode-btn');
 const btnSub = document.getElementById('btn-sub');
 const btnDub = document.getElementById('btn-dub');
 const pinBtn = document.getElementById('pin-episode-btn');
 const videoPlayer = document.getElementById('anime-video');

 // 1. Fetch the raw API response safely
 const apiResponse = await fetchFromTenrai(`/anime/${animeId}`);

 if (apiResponse && apiResponse.data) {
  // 2. Extract the inner data object into a cleanly named variable
  const anime = apiResponse.data;

  // 3. Handle global language title switching (prefer title_english when EN)
  const lang = localStorage.getItem('globalLanguage') || 'EN';
  let chosenTitle = anime.title;
  if (lang === 'JP' && anime.title_japanese) chosenTitle = anime.title_japanese;
  else if (lang === 'EN' && anime.title_english) chosenTitle = anime.title_english;

  // 4. Clean out any "Season N" text strings
  const { cleanTitle } = parseSeasonFromTitle(chosenTitle);

  // 5. Populate Episode Picker Dropdown Options from released episodes only
    let totalEpisodes = anime.episodes || 12;
    let episodeList = [];
    try {
     // fetch all episode pages to avoid artificial caps (lazy-accumulate pages)
     let page = 1;
     while (true) {
        const epsResp = await fetchFromTenrai(`/anime/${animeId}/episodes?page=${page}`);
        if (!(epsResp && Array.isArray(epsResp.data) && epsResp.data.length > 0)) break;
        episodeList.push(...epsResp.data);
        if (!(epsResp.pagination && epsResp.pagination.has_next_page)) break;
        page += 1;
     }
     if (episodeList.length > 0) totalEpisodes = episodeList.length;
    } catch (e) {
     // ignore and fallback to numeric count
    }

  const parsedEpisodeOptions = episodeList.length > 0
   ? episodeList.map(ep => {
      const epNumber = ep.episode || ep.mal_id || null;
      if (!epNumber) return null;
      const title = getEpisodeTitle(ep, lang) || `Episode ${epNumber}`;
      return { number: Number(epNumber), title };
    }).filter(Boolean)
   : Array.from({ length: totalEpisodes }, (_, idx) => ({ number: idx + 1, title: `Episode ${idx + 1}` }));

  epPicker.innerHTML = '';
  parsedEpisodeOptions.forEach(ep => {
   const opt = document.createElement('option');
   opt.value = ep.number;
   opt.innerText = `Ep ${ep.number}: ${ep.title}`;
   if (ep.number === currentEp) opt.selected = true;
   epPicker.appendChild(opt);
  });

  const renderEpisodePicker = () => {
   if (!episodePickerList || !episodeSearch || !currentEpisodeIndicator) return;

   const query = (episodeSearch.value || '').trim().toLowerCase();
   const visibleEpisodes = parsedEpisodeOptions.filter(ep => {
    const matchesNumber = String(ep.number).includes(query);
    const matchesTitle = ep.title.toLowerCase().includes(query);
    return !query || matchesNumber || matchesTitle;
   });

   if (visibleEpisodes.length === 0) {
    episodePickerList.innerHTML = '<div class="episode-empty">No matching episodes.</div>';
    return;
   }

   episodePickerList.innerHTML = visibleEpisodes.map(ep => `
    <button type="button" class="episode-chip ${ep.number === currentEp ? 'active' : ''}" data-ep="${ep.number}">
      <span class="episode-chip-number">Ep ${ep.number}</span>
      <span class="episode-chip-title">${ep.title}</span>
    </button>
   `).join('');

   episodePickerList.querySelectorAll('.episode-chip').forEach(button => {
    button.addEventListener('click', () => {
     const chosenEp = Number(button.dataset.ep);
     if (!isNaN(chosenEp)) {
      window.location.href = `watch.html?animeId=${animeId}&ep=${chosenEp}`;
     }
    });
   });

   currentEpisodeIndicator.innerText = `Ep ${currentEp}`;
   prevEpisodeBtn.disabled = currentEp <= 1;
   nextEpisodeBtn.disabled = currentEp >= Math.max(...parsedEpisodeOptions.map(ep => ep.number), 1);
  };

  if (episodeSearch) {
   episodeSearch.oninput = renderEpisodePicker;
  }

  prevEpisodeBtn.onclick = () => {
   if (currentEp > 1) {
    const previousEp = Math.max(...parsedEpisodeOptions.map(ep => ep.number).filter(n => n < currentEp), 1);
    window.location.href = `watch.html?animeId=${animeId}&ep=${previousEp}`;
   }
  };

  nextEpisodeBtn.onclick = () => {
   const maxEp = Math.max(...parsedEpisodeOptions.map(ep => ep.number), currentEp);
   if (currentEp < maxEp) {
    const nextEp = Math.min(...parsedEpisodeOptions.map(ep => ep.number).filter(n => n > currentEp), maxEp);
    window.location.href = `watch.html?animeId=${animeId}&ep=${nextEp}`;
   }
  };

  const currentEpisode = parsedEpisodeOptions.find(ep => ep.number === currentEp) || null;
  const episodeLabel = currentEpisode ? currentEpisode.title : '';
  videoTitle.innerText = episodeLabel ? `${cleanTitle} — ${episodeLabel}` : `${cleanTitle} (Episode ${currentEp})`;
  renderEpisodePicker();
  saveContinueWatching({
   animeId,
   title: cleanTitle,
   title_japanese: anime.title_japanese || '',
   image: anime.images.jpg.large_image_url,
   episode: currentEp,
   episodeName: episodeLabel,
   timestamp: videoPlayer ? videoPlayer.currentTime : 0
  });
 } else {
  videoTitle.innerText = "Error loading episode metadata.";
 }

 // Dropdown event handling to swap episodes dynamically
 epPicker.onchange = (e) => {
  window.location.href = `watch.html?animeId=${animeId}&ep=${e.target.value}`;
 };

 function setActiveAudioButton(mode) {
  if (mode === "DUB") {
   btnDub.classList.add('active');
   btnSub.classList.remove('active');
  } else {
   btnSub.classList.add('active');
   btnDub.classList.remove('active');
  }
 }

 // Sub / Dub structural audio track selectors
 btnSub.onclick = () => { toggleAudioMode("SUB"); };
 btnDub.onclick = () => { toggleAudioMode("DUB"); };

 function toggleAudioMode(mode) {
  currentMode = mode;
  localStorage.setItem('preferredAudioMode', mode);
  setActiveAudioButton(mode);
  updatePlayer();
 }

 setActiveAudioButton(currentMode);

 function getEpisodeTitle(ep, lang) {
  if (!ep) return '';
  if (lang === 'JP') {
   return ep.title_romanji || ep.title_japanese || ep.title || '';
  }
  return ep.title || ep.title_english || ep.title_japanese || '';
 }

 // Progress Pinning Logic
 pinBtn.onclick = () => {
  let pinnedEpisodes = JSON.parse(localStorage.getItem('pinnedEpisodes')) || [];
  pinnedEpisodes = pinnedEpisodes.filter(item => item.animeId !== animeId);

  pinnedEpisodes.push({
   animeId: animeId,
   title: videoTitle.innerText.split('(')[0].trim(),
   episode: currentEp,
   timestamp: videoPlayer ? videoPlayer.currentTime : 0 // Fallback if using iframe
  });

  localStorage.setItem('pinnedEpisodes', JSON.stringify(pinnedEpisodes));
  alert(`Pinned progress: Episode ${currentEp}!`);
 };

 function updatePlayer() {
  // ✅ FIX 3: querySelector targeting the class layout wrapper from your HTML
  const container = document.querySelector(".video-player-container");
  if (container) {
   container.innerHTML = `<iframe src="https://megaplay.buzz/stream/mal/${animeId}/${currentEp}/${currentMode.toLowerCase()}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`;
  }
 }

 function saveContinueWatching(entry) {
  if (!entry || !entry.animeId) return;
  const list = JSON.parse(localStorage.getItem('continueWatching')) || [];
  const filtered = list.filter(item => item.animeId !== entry.animeId);
  filtered.unshift({
   ...entry,
   lastUpdated: Date.now()
  });
  localStorage.setItem('continueWatching', JSON.stringify(filtered.slice(0, 12)));
 }

 // Boot up the stream player automatically on load
 updatePlayer();

});