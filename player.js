// Handle doubt submission
function sendDoubt() {
  const q = document.getElementById("doubtInput").value.trim();
  const resBox = document.getElementById("doubtResponse");
  if (!q) return resBox.innerHTML = `<p style="color:red;">Please type something.</p>`;
  resBox.innerHTML = `<p><strong>Bot:</strong> "${q}" received. Real AI needs backend.</p>`;
  document.getElementById("doubtInput").value = "";
}

// Toggle doubt section
const toggleBtn = document.getElementById("toggleDoubtBtn");
const doubtBox = document.querySelector(".doubt-section");
toggleBtn.addEventListener("click", () => {
  doubtBox.classList.toggle("open");
  toggleBtn.textContent = doubtBox.classList.contains("open")
    ? "▲ Hide Doubt Section"
    : "▼ Show Doubt Section";
});

// Video & playlist handling
const params = new URLSearchParams(location.search);
let currentIndex = parseInt(params.get("index") || "0", 10);
const stored = localStorage.getItem("ytPlaylistData");
const playlistData = stored ? JSON.parse(stored) : null;
let completed = JSON.parse(localStorage.getItem("completedVideos") || "[]");

const listEl = document.getElementById("playlistList");
const frameEl = document.getElementById("playerFrame");
const titleEl = document.getElementById("videoTitle");

if (playlistData) {
  const { playlistId, videos } = playlistData;

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

      div.onclick = () => { currentIndex = i; playCurrent(); highlightActive(); };
      div.append(text, tick);
      listEl.appendChild(div);
    });
  }

  // Toggle complete / uncomplete
  function toggleComplete() {
    if (completed.includes(currentIndex)) {
      completed = completed.filter(i => i !== currentIndex);
    } else {
      completed.push(currentIndex);
    }
    localStorage.setItem("completedVideos", JSON.stringify(completed));
    renderList();
    playCurrent();
  }

  function highlightActive() {
    document.querySelectorAll(".item").forEach((el, i) =>
      el.classList.toggle("active", i === currentIndex)
    );
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

    // Clean YouTube embed
    frameEl.src = `
      https://www.youtube.com/embed/${video.videoId}
      ?autoplay=1
      &rel=0
      &modestbranding=1
      &showinfo=0
      &controls=1
      &vq=hd1080
    `.replace(/\s+/g, '');
  }

  renderList();
  playCurrent();
}
