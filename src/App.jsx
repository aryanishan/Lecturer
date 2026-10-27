import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Home,
  ListVideo,
  Loader2,
  Menu,
  Moon,
  Play,
  Plus,
  Save,
  Send,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  extractPlaylistId,
  fetchPlaylistTitle,
  fetchPlaylistVideos,
} from "./services/youtube";
import {
  getCompletedDataSafe,
  getCurrentPlaylist,
  getPlaylistProgress,
  getSavedPlaylists,
  setCompletedForPlaylist,
  setCurrentPlaylist,
  setSavedPlaylists,
} from "./utils/storage";

const cx = (...classes) => classes.filter(Boolean).join(" ");
const THEME_KEY = "lecture-viewer-theme";

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return [
    theme,
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  ];
}

function App() {
  const [theme, toggleTheme] = useTheme();
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage theme={theme} onToggleTheme={toggleTheme} />}
      />
      <Route
        path="/player"
        element={<PlayerPage theme={theme} onToggleTheme={toggleTheme} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

function HomePage({ theme, onToggleTheme }) {
  const [playlistInput, setPlaylistInput] = useState("");
  const [currentPlaylist, setCurrentPlaylistState] = useState(null);
  const [loadedRawInput, setLoadedRawInput] = useState("");
  const [lecturesVisible, setLecturesVisible] = useState(true);
  const [savedPlaylists, setSavedPlaylistsState] = useState(() =>
    getSavedPlaylists(),
  );
  const [status, setStatus] = useState({ tone: "muted", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const inputMatchesLoaded =
    currentPlaylist && playlistInput.trim() === loadedRawInput;

  useEffect(() => {
    const refreshSavedPlaylists = () =>
      setSavedPlaylistsState(getSavedPlaylists());
    window.addEventListener("focus", refreshSavedPlaylists);
    document.addEventListener("visibilitychange", refreshSavedPlaylists);
    return () => {
      window.removeEventListener("focus", refreshSavedPlaylists);
      document.removeEventListener("visibilitychange", refreshSavedPlaylists);
    };
  }, []);
  async function handleLoadLectures() {
    if (inputMatchesLoaded) {
      setLecturesVisible((visible) => !visible);
      return;
    }
    const raw = playlistInput.trim();
    if (!raw) {
      setStatus({
        tone: "error",
        message: "Paste a playlist link or ID to begin.",
      });
      return;
    }
    const playlistId = extractPlaylistId(raw);
    if (!playlistId) {
      setStatus({
        tone: "error",
        message: "That playlist link or ID doesn't look right.",
      });
      return;
    }
    setIsLoading(true);
    setStatus({ tone: "muted", message: "Fetching your lectures…" });
    try {
      const [videos, playlistTitle] = await Promise.all([
        fetchPlaylistVideos(playlistId),
        fetchPlaylistTitle(playlistId),
      ]);
      const playlist = { playlistId, playlistTitle, videos };
      setCurrentPlaylist(playlist);
      setCurrentPlaylistState(playlist);
      setLoadedRawInput(raw);
      setLecturesVisible(true);
      setStatus({
        tone: "success",
        message: `${videos.length} lectures are ready to study.`,
      });
    } catch (error) {
      console.error(error);
      setCurrentPlaylistState(null);
      setStatus({
        tone: "error",
        message: "Couldn’t load this playlist. Check the link and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  function clearLoadedLectures() {
    setCurrentPlaylistState(null);
    setLoadedRawInput("");
    setLecturesVisible(true);
    setStatus({ tone: "muted", message: "" });
  }
  function savePlaylist() {
    if (!currentPlaylist) {
      setStatus({ tone: "error", message: "Load a playlist first." });
      return;
    }
    const saved = getSavedPlaylists();
    if (
      saved.some(
        (playlist) => playlist.playlistId === currentPlaylist.playlistId,
      )
    ) {
      setStatus({
        tone: "warning",
        message: "This playlist is already in your library.",
      });
      return;
    }
    const nextSaved = [...saved, currentPlaylist];
    setSavedPlaylists(nextSaved);
    setSavedPlaylistsState(nextSaved);
    setStatus({ tone: "success", message: "Playlist saved to your library." });
  }
  function openLecture(index) {
    window.open(`/player?index=${index}`, "_blank", "noopener,noreferrer");
  }
  function openSavedPlaylist(playlist) {
    setCurrentPlaylist(playlist);
    window.open("/player?index=0", "_blank", "noopener,noreferrer");
  }
  function deleteSavedPlaylist(index) {
    const nextSaved = savedPlaylists.filter(
      (_, itemIndex) => itemIndex !== index,
    );
    setSavedPlaylists(nextSaved);
    setSavedPlaylistsState(nextSaved);
  }
  const loadButtonText = isLoading
    ? "Loading"
    : inputMatchesLoaded
      ? lecturesVisible
        ? "Hide lectures"
        : "Show lectures"
      : "Load lectures";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lecturer home">
          <span className="brand-mark">
            <Play size={15} fill="currentColor" />
          </span>
          <span>Lecturer</span>
        </a>
        <div className="topbar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            className="icon-button mobile-only"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open saved playlists"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>
      <div className="home-layout">
        <SavedPlaylists
          playlists={savedPlaylists}
          onOpen={openSavedPlaylist}
          onDelete={deleteSavedPlaylist}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="home-main">
          <section className="intro">
            <p className="eyebrow">YOUR STUDY SPACE</p>
            <h1>Make every lecture count.</h1>
            <p>
              Bring in a YouTube playlist, pick up where you left off, and keep
              your learning organised.
            </p>
          </section>
          <section className="import-card" aria-labelledby="import-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">NEW PLAYLIST</p>
                <h2 id="import-heading">Add lectures</h2>
              </div>
              <ListVideo size={21} />
            </div>
            <label className="input-label" htmlFor="playlist-link">
              YouTube playlist link or ID
            </label>
            <div className="import-form">
              <input
                id="playlist-link"
                value={playlistInput}
                onChange={(event) => setPlaylistInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLoadLectures();
                }}
                placeholder="https://youtube.com/playlist?list=…"
              />
              <button
                type="button"
                onClick={handleLoadLectures}
                disabled={isLoading}
                className="button button-primary"
              >
                {isLoading ? (
                  <Loader2 size={17} className="spin" />
                ) : inputMatchesLoaded && lecturesVisible ? (
                  <ChevronUp size={17} />
                ) : inputMatchesLoaded ? (
                  <ChevronDown size={17} />
                ) : (
                  <Plus size={17} />
                )}
                {loadButtonText}
              </button>
            </div>
            {currentPlaylist && (
              <div className="loaded-actions">
                <button
                  type="button"
                  onClick={clearLoadedLectures}
                  className="button button-ghost"
                >
                  <X size={16} />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={savePlaylist}
                  className="button button-secondary"
                >
                  <Save size={16} />
                  Save to library
                </button>
              </div>
            )}
            {status.message && <StatusMessage status={status} />}
          </section>
          <LectureResults
            playlist={currentPlaylist}
            visible={lecturesVisible}
            onOpen={openLecture}
          />
        </main>
      </div>
    </div>
  );
}

function SavedPlaylists({ playlists, onOpen, onDelete, isOpen, onClose }) {
  return (
    <>
      <button
        className={cx("sidebar-scrim", isOpen && "is-visible")}
        onClick={onClose}
        aria-label="Close saved playlists"
      />
      <aside className={cx("library-sidebar", isOpen && "is-open")}>
        <div className="sidebar-title">
          <div>
            <p className="eyebrow">LIBRARY</p>
            <h2>Saved playlists</h2>
          </div>
          <button
            className="icon-button mobile-only"
            type="button"
            onClick={onClose}
            aria-label="Close saved playlists"
          >
            <X size={18} />
          </button>
        </div>
        {playlists.length === 0 ? (
          <div className="empty-library">
            <BookmarkPlus size={22} />
            <p>Your saved playlists will appear here.</p>
          </div>
        ) : (
          <ul className="saved-list">
            {playlists.map((playlist, index) => (
              <SavedPlaylistItem
                key={playlist.playlistId}
                playlist={playlist}
                onOpen={() => {
                  onOpen(playlist);
                  onClose();
                }}
                onDelete={() => onDelete(index)}
              />
            ))}
          </ul>
        )}
        <p className="sidebar-footer">Built for focused learning</p>
      </aside>
    </>
  );
}

function SavedPlaylistItem({ playlist, onOpen, onDelete }) {
  const progress = getPlaylistProgress(playlist);
  return (
    <li className="saved-item">
      <button type="button" onClick={onOpen} className="saved-item-main">
        <span className="saved-item-title">{playlist.playlistTitle}</span>
        <span className="saved-item-meta">
          {progress.done} of {progress.total} complete
        </span>
        <ProgressMeter percent={progress.percent} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="delete-button"
        aria-label={`Delete ${playlist.playlistTitle}`}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
function LectureResults({ playlist, visible, onOpen }) {
  if (!playlist || !visible) return null;
  return (
    <section className="lecture-card" aria-labelledby="lectures-heading">
      <div className="lecture-card-heading">
        <div>
          <p className="eyebrow">PLAYLIST</p>
          <h2 id="lectures-heading">{playlist.playlistTitle}</h2>
        </div>
        <span className="lecture-count">{playlist.videos.length} lectures</span>
      </div>
      <div className="lecture-list">
        {playlist.videos.map((video, index) => (
          <button
            key={`${video.videoId}-${index}`}
            type="button"
            onClick={() => onOpen(index)}
            className="lecture-row"
          >
            <span className="lecture-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="lecture-title">{video.title}</span>
            <span className="play-circle">
              <Play size={14} fill="currentColor" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
function StatusMessage({ status }) {
  return (
    <p className={cx("status-message", `status-${status.tone}`)} role="status">
      {status.message}
    </p>
  );
}

function PlayerPage({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const playlistData = useMemo(() => getCurrentPlaylist(), []);
  const videos = playlistData?.videos || [];
  const playlistId = playlistData?.playlistId;
  const [currentIndex, setCurrentIndex] = useState(() => {
    const rawIndex = Number.parseInt(searchParams.get("index") || "0", 10);
    return Number.isInteger(rawIndex) && rawIndex >= 0 ? rawIndex : 0;
  });
  const [completedData, setCompletedData] = useState(() =>
    getCompletedDataSafe(),
  );
  const [isDoubtOpen, setIsDoubtOpen] = useState(false);
  const [doubtText, setDoubtText] = useState("");
  const [doubtResponse, setDoubtResponse] = useState({
    tone: "muted",
    message: "",
  });
  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) selectVideo(0);
  }, [currentIndex, videos.length]);
  if (!playlistData)
    return (
      <EmptyPlayerState
        onBack={() => navigate("/")}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    );
  const completed = completedData[playlistId] || [];
  const currentVideo = videos[currentIndex] || videos[0];
  const isCurrentComplete = completed.includes(currentIndex);
  const progressPercent =
    videos.length === 0
      ? 0
      : Math.round((completed.length / videos.length) * 100);
  function selectVideo(index) {
    setCurrentIndex(index);
    setSearchParams({ index: String(index) });
  }
  function toggleComplete() {
    const nextCompleted = isCurrentComplete
      ? completed.filter((index) => index !== currentIndex)
      : [...completed, currentIndex];
    setCompletedData(setCompletedForPlaylist(playlistId, nextCompleted));
  }
  function handleDoubtSubmit() {
    const question = doubtText.trim();
    if (!question) {
      setDoubtResponse({ tone: "error", message: "Type a question first." });
      return;
    }
    setDoubtResponse({
      tone: "success",
      message: `Your question has been noted: “${question}”`,
    });
    setDoubtText("");
  }
  function closePlayer() {
    window.close();
    window.setTimeout(() => navigate("/"), 150);
  }
  return (
    <div className="player-shell">
      <aside className="player-sidebar">
        <div className="player-sidebar-head">
          <div>
            <p className="eyebrow">NOW STUDYING</p>
            <h1>{playlistData.playlistTitle}</h1>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div className="player-progress">
          <div className="progress-copy">
            <span>Course progress</span>
            <strong>{progressPercent}%</strong>
          </div>
          <ProgressMeter percent={progressPercent} />
        </div>
        <div className="player-list">
          {videos.map((video, index) => {
            const isActive = index === currentIndex;
            const isDone = completed.includes(index);
            return (
              <button
                key={`${video.videoId}-${index}`}
                type="button"
                onClick={() => selectVideo(index)}
                className={cx("player-lecture", isActive && "is-active")}
              >
                <span className="player-lecture-number">
                  {isDone ? (
                    <Check size={14} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <span>{video.title}</span>
              </button>
            );
          })}
        </div>
      </aside>
      <main className="player-main">
        <header className="player-topbar">
          <button type="button" className="back-link" onClick={closePlayer}>
            <ArrowLeft size={17} />
            Library
          </button>
          <div className="player-actions">
            <button
              type="button"
              onClick={toggleComplete}
              className={cx(
                "button",
                isCurrentComplete ? "button-ghost" : "button-secondary",
              )}
            >
              <Check size={16} />
              {isCurrentComplete ? "Completed" : "Mark complete"}
            </button>
            <button
              type="button"
              onClick={closePlayer}
              className="icon-button"
              aria-label="Close player"
            >
              <X size={19} />
            </button>
          </div>
        </header>
        <section className="watch-area">
          <p className="eyebrow">
            LECTURE {String(currentIndex + 1).padStart(2, "0")}
          </p>
          <h2>{currentVideo?.title || "Loading…"}</h2>
          <div className="video-frame">
            {currentVideo && (
              <iframe
                title={currentVideo.title}
                src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
          </div>
        </section>
        <section className="doubt-area">
          <button
            type="button"
            onClick={() => setIsDoubtOpen((open) => !open)}
            className="doubt-toggle"
          >
            <span>
              <CircleHelp size={18} />
              <span>
                <strong>Have a question?</strong>
                <small>Keep a note while you study</small>
              </span>
            </span>
            {isDoubtOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {isDoubtOpen && (
            <div className="doubt-form">
              <label htmlFor="doubt">Your question</label>
              <textarea
                id="doubt"
                value={doubtText}
                onChange={(event) => setDoubtText(event.target.value)}
                placeholder="What would you like to revisit?"
              />
              <button
                type="button"
                onClick={handleDoubtSubmit}
                className="button button-primary"
              >
                <Send size={16} />
                Save question
              </button>
              {doubtResponse.message && (
                <StatusMessage status={doubtResponse} />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyPlayerState({ onBack, theme, onToggleTheme }) {
  return (
    <div className="empty-player">
      <div className="empty-player-bar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Play size={15} fill="currentColor" />
          </span>
          <span>Lecturer</span>
        </a>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className="empty-card">
        <Home size={25} />
        <h1>No playlist loaded</h1>
        <p>
          Choose a playlist from your library or add a new one to start
          studying.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="button button-primary"
        >
          <ArrowLeft size={16} />
          Back to library
        </button>
      </div>
    </div>
  );
}
function ProgressMeter({ percent, className = "" }) {
  return (
    <div className={cx("progress-meter", className)}>
      <div style={{ width: `${percent}%` }} />
    </div>
  );
}
export default App;
