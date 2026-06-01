document.addEventListener("DOMContentLoaded", async () => {
 const params = new URLSearchParams(window.location.search);
 const animeId = params.get('animeId');
 let currentEp = parseInt(params.get('ep')) || 1;
 let currentMode = "SUB"; // ✅ FIX 1: Define currentMode globally within this scope

 if (!animeId) {
  window.location.href = 'index.html';
  return;
 }

 document.getElementById('back-to-anime').href = `anime.html?id=${animeId}`;

 const videoTitle = document.getElementById('video-title');
 const epPicker = document.getElementById('ep-picker');
 const btnSub = document.getElementById('btn-sub');
 const btnDub = document.getElementById('btn-dub');
 const pinBtn = document.getElementById('pin-episode-btn');
 const videoPlayer = document.getElementById('anime-video');

 // 1. Fetch the raw API response safely
 const apiResponse = await fetchFromJikan(`/anime/${animeId}`);

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
  videoTitle.innerText = `${cleanTitle} (Episode ${currentEp})`;

  // 5. Populate Episode Picker Dropdown Options from released episodes only
  let totalEpisodes = anime.episodes || 12;
  try {
   const epsResp = await fetchFromJikan(`/anime/${animeId}/episodes`);
   if (epsResp && epsResp.data && Array.isArray(epsResp.data) && epsResp.data.length > 0) {
    totalEpisodes = epsResp.data.length;
   }
  } catch (e) {
   // ignore and fallback to numeric count
  }

  epPicker.innerHTML = ''; // Clear placeholder data safely
  for (let i = 1; i <= totalEpisodes; i++) {
   const opt = document.createElement('option');
   opt.value = i;
   opt.innerText = `Episode ${i}`;
   if (i === currentEp) opt.selected = true;
   epPicker.appendChild(opt);
  }
 } else {
  videoTitle.innerText = "Error loading episode metadata.";
 }

 // Dropdown event handling to swap episodes dynamically
 epPicker.onchange = (e) => {
  window.location.href = `watch.html?animeId=${animeId}&ep=${e.target.value}`;
 };

 // Sub / Dub structural audio track selectors
 btnSub.onclick = () => { toggleAudioMode("SUB"); };
 btnDub.onclick = () => { toggleAudioMode("DUB"); };

 function toggleAudioMode(mode) {
  currentMode = mode; // ✅ FIX 2: Actually update the variable when clicked
  if (mode === "SUB") {
   btnSub.classList.add('active');
   btnDub.classList.remove('active');
  } else {
   btnDub.classList.add('active');
   btnSub.classList.remove('active');
  }
  updatePlayer();
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

 // Boot up the stream player automatically on load
 updatePlayer();

});