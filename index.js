// DOM elements
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const savedList = document.getElementById("savedList");
const playlistInput = document.getElementById("playlistInput");

let lecturesLoaded = false;
const API_KEY = "AIzaSyDvCqcPf09hiBeXscXkFLTpe86HPvttVFo"; // YOUR API KEY

// Load / Hide Lectures
loadBtn.onclick = async () => {
  if (lecturesLoaded) return toggleLectures();

  const url = playlistInput.value.trim();
  if (!url.includes("list=")) {
    statusEl.innerHTML = "<p style='color:red'>Invalid playlist link.</p>";
    return;
  }

  const playlistId = url.split("list=")[1].split("&")[0];
  statusEl.textContent = "Loading playlist...";

  try {
    const videos = await fetchPlaylistVideos(playlistId);
    const realTitle = await fetchPlaylistTitle(playlistId);

    localStorage.setItem("ytPlaylistData", JSON.stringify({
      playlistId,
      playlistTitle: realTitle,
      videos
    }));

    renderLectures(videos);
    saveBtn.style.display = "inline-block";
    loadBtn.textContent = "Hide Lectures ▲";
    lecturesLoaded = true;
  } catch (err) {
    statusEl.innerHTML = `<p style='color:red'>Failed. API Error.</p>`;
  }
};

// FETCH all videos in playlist
async function fetchPlaylistVideos(id) {
  let allVideos = [];
  let nextPageToken = "";

  while (true) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&pageToken=${nextPageToken}&playlistId=${id}&key=${API_KEY}`
    );
    const data = await res.json();
    if (!data.items) throw new Error();

    allVideos = [
      ...allVideos,
      ...data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId
      }))
    ];

    if (!data.nextPageToken) break;
    nextPageToken = data.nextPageToken;
  }
  return allVideos;
}

// FETCH real playlist title
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

// Save playlist
saveBtn.onclick = async () => {
  const data = JSON.parse(localStorage.getItem("ytPlaylistData") || "{}");
  if (!data.playlistId || !data.videos) {
    alert("Load lectures first!");
    return;
  }

  let saved = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");
  if (saved.some(p => p.playlistId === data.playlistId)) {
    alert("Playlist already saved!");
    return;
  }

  saved.push({
    playlistId: data.playlistId,
    playlistTitle: data.playlistTitle,
    videos: data.videos
  });

  localStorage.setItem("savedPlaylists", JSON.stringify(saved));
  renderSavedPlaylists();
};

// Render lectures
function renderLectures(videos) {
  resultsEl.innerHTML = "";
  resultsEl.style.display = "block";
  statusEl.textContent = `Loaded ${videos.length} lectures.`;

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

// Show / hide lectures
function toggleLectures() {
  const isHidden = resultsEl.style.display === "none";
  resultsEl.style.display = isHidden ? "block" : "none";
  loadBtn.textContent = isHidden ? "Hide Lectures ▲" : "Show Lectures ▼";
}

// Open in player
function openLecture(index) {
  window.open(`player.html?index=${index}`, "_blank");
}

/* --------------------------
   SAVED PLAYLISTS (UI + DELETE OPTION)
---------------------------*/

// Render saved playlists (with delete button)
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
      <div class="btn-group">
        <button onclick="openSavedPlaylist(${index})" class="open-saved-btn">▶ Watch</button>
        <button onclick="deleteSavedPlaylist(${index})" class="delete-btn">✖</button>
      </div>
    `;

    savedList.appendChild(li);
  });
}

// Open saved playlist
function openSavedPlaylist(index) {
  const saved = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");
  if (!saved[index]) return;

  localStorage.setItem("ytPlaylistData", JSON.stringify(saved[index]));
  window.open("player.html?index=0", "_blank");
}

// Delete saved playlist
function deleteSavedPlaylist(index) {
  let playlists = JSON.parse(localStorage.getItem("savedPlaylists") || "[]");
  playlists.splice(index, 1);
  localStorage.setItem("savedPlaylists", JSON.stringify(playlists));
  renderSavedPlaylists();
}

// Load saved playlists on startup
renderSavedPlaylists();
