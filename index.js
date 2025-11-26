// ===== DOM ELEMENTS =====
const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const savedList = document.getElementById("savedList");
const playlistInput = document.getElementById("playlistInput");

let lecturesLoaded = false;
const API_KEY = "AIzaSyDvCqcPf09hiBeXscXkFLTpe86HPvttVFo";

// ===== LOAD / HIDE LECTURES =====
loadBtn.onclick = async () => {
  if (lecturesLoaded) {
    toggleLectures();
    return;
  }

  const raw = playlistInput.value.trim();
  if (!raw) {
    statusEl.innerHTML = "<span style='color:#f87171'>Please paste playlist link or ID.</span>";
    return;
  }

  const playlistId = extractPlaylistId(raw);
  if (!playlistId) {
    statusEl.innerHTML = "<span style='color:#f87171'>Invalid playlist link / ID.</span>";
    return;
  }

  statusEl.textContent = "Loading playlist...";

  try {
    const videos = await fetchPlaylistVideos(playlistId);
    const realTitle = await fetchPlaylistTitle(playlistId);

    // store current playlist (used by player.html)
    localStorage.setItem(
      "ytPlaylistData",
      JSON.stringify({
        playlistId,
        playlistTitle: realTitle,
        videos,
      })
    );

    renderLectures(videos);

    saveBtn.style.display = "inline-block";
    clearBtn.style.display = "inline-block";
    loadBtn.textContent = "Hide Lectures ▲";
    lecturesLoaded = true;
    statusEl.textContent = `Loaded ${videos.length} videos.`;
  } catch (err) {
    console.error(err);
    statusEl.innerHTML =
      "<span style='color:#f87171'>Failed to load playlist (API error).</span>";
  }
};

// ===== CLEAR LOADED LECTURES =====
clearBtn.onclick = () => {
  resultsEl.innerHTML = "";
  resultsEl.style.display = "none";
  statusEl.textContent = "";
  lecturesLoaded = false;

  loadBtn.textContent = "Load Lectures";
  clearBtn.style.display = "none";
  saveBtn.style.display = "none";
};

// ===== TOGGLE VISIBILITY =====
function toggleLectures() {
  const hidden = resultsEl.style.display === "none";
  resultsEl.style.display = hidden ? "block" : "none";
  loadBtn.textContent = hidden ? "Hide Lectures ▲" : "Show Lectures ▼";
}

// ===== UTIL: EXTRACT PLAYLIST ID =====
function extractPlaylistId(input) {
  if (input.includes("list=")) {
    return input.split("list=")[1].split("&")[0];
  }
  if (input.length > 10) return input; // assume raw ID
  return null;
}

// ===== FETCH YOUTUBE DATA =====
async function fetchPlaylistVideos(id) {
  let allVideos = [];
  let nextPageToken = "";

  while (true) {
    const url =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      `?part=snippet&maxResults=50&pageToken=${nextPageToken}&playlistId=${id}&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) throw new Error("Invalid API response");

    allVideos = allVideos.concat(
      data.items.map((item) => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
      }))
    );

    if (!data.nextPageToken) break;
    nextPageToken = data.nextPageToken;
  }

  return allVideos;
}

async function fetchPlaylistTitle(id) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${id}&key=${API_KEY}`
    );
    const data = await res.json();
    return data.items?.[0]?.snippet?.title || `Playlist - ${id}`;
  } catch {
    return `Playlist - ${id}`;
  }
}

// ===== RENDER LECTURES ON MAIN PAGE =====
function renderLectures(videos) {
  resultsEl.innerHTML = "";
  resultsEl.style.display = "block";

  videos.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "video-item";
    div.innerHTML = `
      <span>${i + 1}. ${v.title}</span>
      <button class="play-btn" onclick="event.stopPropagation(); openLecture(${i})">▶</button>
    `;
    div.onclick = () => openLecture(i);
    resultsEl.appendChild(div);
  });
}

function openLecture(index) {
  window.open(`player.html?index=${index}`, "_blank");
}

// ===== SAVE PLAYLIST TO SIDEBAR =====
saveBtn.onclick = () => {
  const data = JSON.parse(localStorage.getItem("ytPlaylistData") || "{}");
  if (!data.playlistId || !data.videos) {
    alert("Load lectures first!");
    return;
  }

  let saved = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");
  if (saved.some((p) => p.playlistId === data.playlistId)) {
    alert("Playlist already saved!");
    return;
  }

  saved.push({
    playlistId: data.playlistId,
    playlistTitle: data.playlistTitle,
    videos: data.videos,
  });

  localStorage.setItem("savedPlaylists", JSON.stringify(saved));
  renderSavedPlaylists();
};

// ===== SIDEBAR: SAVED PLAYLISTS + PROGRESS =====
function renderSavedPlaylists() {
  savedList.innerHTML = "";
  const playlists = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");

  if (playlists.length === 0) {
    savedList.innerHTML = "<p class='empty-message'>No saved playlists yet.</p>";
    return;
  }

  playlists.forEach((pl, index) => {
    const li = document.createElement("li");
    li.className = "saved-playlist-item";

    li.innerHTML = `
      <span class="pl-title">${pl.playlistTitle}</span>

      <div class="progress-container">
        <div class="progress-bar" id="pl-progress-${pl.playlistId}"></div>
      </div>
      <p class="progress-text" id="pl-text-${pl.playlistId}"></p>

      <div class="btn-group">
        <button onclick="openSavedPlaylist(${index})" class="open-saved-btn">▶ Watch</button>
        <button onclick="deleteSavedPlaylist(${index})" class="delete-btn">✖</button>
      </div>
    `;

    savedList.appendChild(li);
    updatePlaylistProgress(pl);
  });
}

// UTIL: ensure completedVideos is a plain object, not an array
function getCompletedDataSafe() {
  let raw = localStorage.getItem("completedVideos");
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    parsed = {};
  }
  return parsed;
}

function updatePlaylistProgress(pl) {
  const completedData = getCompletedDataSafe();
  const completed = completedData[pl.playlistId] || [];

  const total = pl.videos.length;
  const done = completed.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const bar = document.getElementById(`pl-progress-${pl.playlistId}`);
  const text = document.getElementById(`pl-text-${pl.playlistId}`);

  if (bar) bar.style.width = percent + "%";
  if (text) text.textContent = percent === 100 ? "Completed" : `${percent}% Done`;
}

function openSavedPlaylist(index) {
  const saved = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");
  if (!saved[index]) return;
  localStorage.setItem("ytPlaylistData", JSON.stringify(saved[index]));
  window.open("player.html?index=0", "_blank");
}

function deleteSavedPlaylist(index) {
  let playlists = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");
  playlists.splice(index, 1);
  localStorage.setItem("savedPlaylists", JSON.stringify(playlists));
  renderSavedPlaylists();
}

// ===== INIT + AUTO REFRESH =====
renderSavedPlaylists();

window.addEventListener("focus", renderSavedPlaylists);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderSavedPlaylists();
});
