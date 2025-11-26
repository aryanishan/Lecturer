// ===== DOUBT SECTION =====
function sendDoubt() {
  const q = document.getElementById("doubtInput").value.trim();
  const resBox = document.getElementById("doubtResponse");
  if (!q) {
    resBox.innerHTML = `<p style="color:red;">Please type something.</p>`;
    return;
  }
  resBox.innerHTML = `<p><strong>Bot:</strong> "${q}" received. Real AI needs backend.</p>`;
  document.getElementById("doubtInput").value = "";
}

const toggleBtn = document.getElementById("toggleDoubtBtn");
const doubtBox = document.querySelector(".doubt-section");
toggleBtn.addEventListener("click", () => {
  doubtBox.classList.toggle("open");
  toggleBtn.textContent = doubtBox.classList.contains("open")
    ? "▲ Hide Doubt Section"
    : "▼ Show Doubt Section";
});

// ===== VIDEO / PLAYLIST HANDLING =====
const params = new URLSearchParams(location.search);
let currentIndex = parseInt(params.get("index") || "0", 10);

const stored = localStorage.getItem("ytPlaylistData");
const playlistData = stored ? JSON.parse(stored) : null;

const listEl = document.getElementById("playlistList");
const frameEl = document.getElementById("playerFrame");
const titleEl = document.getElementById("videoTitle");

// ensure root container is a plain object
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

let completedData = getCompletedDataSafe();

if (playlistData) {
  const { playlistId, videos } = playlistData;

  if (!completedData[playlistId]) {
    completedData[playlistId] = [];
  }
  let completed = completedData[playlistId]; // indices for THIS playlist

  function renderList() {
    listEl.innerHTML = "";
    videos.forEach((v, i) => {
      const div = document.createElement("div");
      div.className = "item" + (i === currentIndex ? " active" : "");

      const text = document.createElement("span");
      text.textContent = `${i + 1}. ${v.title}`;

      const tick = document.createElement("span");
      tick.textContent = "✔";
      tick.style.color = "#22c55e";
      tick.style.visibility = completed.includes(i) ? "visible" : "hidden";

      div.onclick = () => {
        currentIndex = i;
        playCurrent();
        updatePlayerProgress();
      };

      div.append(text, tick);
      listEl.appendChild(div);
    });
  }

  function toggleComplete() {
    if (completed.includes(currentIndex)) {
      completed = completed.filter((i) => i !== currentIndex);
    } else {
      completed.push(currentIndex);
    }

    completedData[playlistId] = completed;
    localStorage.setItem("completedVideos", JSON.stringify(completedData));

    renderList();
    playCurrent();
    updatePlayerProgress();
  }

  function playCurrent() {
    const video = videos[currentIndex];
    const isDone = completed.includes(currentIndex);

    titleEl.innerHTML = `
      ${video.title}
      <button class="btn" onclick="toggleComplete()">
        ${isDone ? "Mark Uncomplete" : "Mark Complete"}
      </button>
    `;

    frameEl.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`;
  }

  function updatePlayerProgress() {
    const total = videos.length;
    const done = completed.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const bar = document.getElementById("playerProgressBar");
    const text = document.getElementById("playerProgressText");
    if (bar) bar.style.width = percent + "%";
    if (text) text.textContent = percent === 100 ? "Completed" : `${percent}% Done`;
  }

  renderList();
  playCurrent();
  updatePlayerProgress();
}
