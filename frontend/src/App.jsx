import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  EllipsisVertical,
  Heart,
  Home,
  Link2,
  ListVideo,
  Loader2,
  Lock,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Users,
  X,
  Zap,
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
  extractVideoId,
  fetchPlaylistTitle,
  fetchPlaylistVideos,
  fetchVideoDetails,
} from "./services/youtube";
import {
  getCompletedDataSafe,
  getCurrentPlaylist,
  getPlaylistProgress,
  getSavedPlaylists,
  getFavorites,
  getLearningLadder,
  setLearningLadder,
  toggleFavorite,
  isFavorite,
  getAllNotes,
  countAllNotes,
  setCompletedForPlaylist,
  setCurrentPlaylist,
  setSavedPlaylists,
  setNoteForVideo,
  getNotesForPlaylist,
  getVideoProgress,
  setVideoProgress,
} from "./utils/storage";
import { useAuth } from "./auth.jsx";

const cx = (...classes) => classes.filter(Boolean).join(" ");
const THEME_KEY = "lecture-viewer-theme";

function formatWatchTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

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

/* ─── Main App ─── */
function App() {
  const [theme, toggleTheme] = useTheme();
  const { user, isRestoring } = useAuth();
  if (isRestoring)
    return (
      <div className="auth-loading">
        <Loader2 size={28} className="spin" />
        <span>Restoring your study space…</span>
      </div>
    );
  if (!user) return <AuthScreen theme={theme} onToggleTheme={toggleTheme} />;
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

/* ═══════════════════════════════════════════════
   AUTH SCREEN — Premium split-panel login
   ═══════════════════════════════════════════════ */
function AuthScreen({ theme, onToggleTheme }) {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await (isRegistering ? register : login)({ email, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {/* Left brand panel */}
        <div className="auth-brand">
          <div className="auth-brand-content">
            <div className="logo-icon">
              <Play size={28} fill="#fff" />
            </div>
            <h1>
              Study<span className="brand-dot-pink">Shelf</span>
            </h1>
            <p>
              Your personal study space. Bring in YouTube playlists, track
              progress, and keep your learning organized.
            </p>
            <div className="auth-features">
              <div className="auth-feature-item item-yellow">
                <Zap size={16} />
                <span>No ads, pure focus</span>
              </div>
              <div className="auth-feature-item item-green">
                <Shield size={16} />
                <span>Free to use, forever</span>
              </div>
              <div className="auth-feature-item item-blue">
                <Users size={16} />
                <span>Built for learners</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-section">
          <h2>{isRegistering ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtitle">
            {isRegistering
              ? "Save your playlists and progress securely across devices."
              : "Sign in to continue where you left off."}
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                className="form-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                autoComplete={
                  isRegistering ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength="8"
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="spin" />}
              {isRegistering ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="auth-switch">
            {isRegistering
              ? "Already have an account?"
              : "New here?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering((v) => !v);
                setError("");
              }}
            >
              {isRegistering ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HOME PAGE — Full StudyShelf dashboard
   ═══════════════════════════════════════════════ */
function HomePage({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
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
  const [activeNav, setActiveNav] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavoritesState] = useState(() => getFavorites());
  const [learningLadderIds, setLearningLadderIds] = useState(() => getLearningLadder());

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

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    const videoId = extractVideoId(raw);
    const playlistId = videoId ? null : extractPlaylistId(raw);
    if (!playlistId && !videoId) {
      setStatus({
        tone: "error",
        message: "Paste a valid YouTube playlist or video link.",
      });
      return;
    }
    setIsLoading(true);
    setStatus({ tone: "muted", message: "Fetching your lectures…" });
    try {
      const playlist = videoId
        ? await fetchSingleVideo(videoId)
        : await fetchPlaylist(playlistId);
      setCurrentPlaylist(playlist);
      setCurrentPlaylistState(playlist);
      setLoadedRawInput(raw);
      setLecturesVisible(true);
      setStatus({
        tone: "success",
        message: `${playlist.videos.length} ${playlist.sourceType === "video" ? "video is" : "lectures are"} ready to study.`,
      });
    } catch (error) {
      console.error(error);
      setCurrentPlaylistState(null);
      setStatus({
        tone: "error",
        message: "Couldn't load this playlist. Check the link and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPlaylist(playlistId) {
    const [videos, playlistTitle] = await Promise.all([
      fetchPlaylistVideos(playlistId),
      fetchPlaylistTitle(playlistId),
    ]);
    return {
      playlistId,
      playlistTitle,
      videos,
      sourceType: "playlist",
      addedAt: Date.now(),
    };
  }

  async function fetchSingleVideo(videoId) {
    const video = await fetchVideoDetails(videoId);
    return {
      playlistId: `video-${videoId}`,
      playlistTitle: video.title,
      channelTitle: video.channelTitle,
      sourceType: "video",
      videos: [{ title: video.title, videoId }],
      addedAt: Date.now(),
    };
  }

  function clearLoadedLectures() {
    setCurrentPlaylistState(null);
    setLoadedRawInput("");
    setLecturesVisible(true);
    setStatus({ tone: "muted", message: "" });
  }

  function savePlaylist() {
    if (!currentPlaylist) {
      setStatus({ tone: "error", message: "Load a playlist or video first." });
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
    setStatus({
      tone: "success",
      message: `${currentPlaylist.sourceType === "video" ? "Video" : "Playlist"} saved to your library.`,
    });
  }

  function openLecture(index) {
    window.open(`/player?index=${index}`, "_blank", "noopener,noreferrer");
  }

  function openSavedPlaylist(playlist) {
    setCurrentPlaylist(playlist);
    window.open("/player?index=0", "_blank", "noopener,noreferrer");
  }

  function deleteSavedPlaylist(playlistId) {
    const nextSaved = savedPlaylists.filter(
      (playlist) => playlist.playlistId !== playlistId,
    );
    setSavedPlaylists(nextSaved);
    setSavedPlaylistsState(nextSaved);
    setLearningLadderIds(setLearningLadder(
      learningLadderIds.filter((id) => id !== playlistId),
    ));
  }

  function updateLearningLadder(playlistIds) {
    const savedIds = new Set(savedPlaylists.map((playlist) => playlist.playlistId));
    setLearningLadderIds(setLearningLadder(
      playlistIds.filter((id) => savedIds.has(id)),
    ));
  }

  function handleToggleFavorite(playlistId) {
    const newFavs = toggleFavorite(playlistId);
    setFavoritesState(newFavs);
  }

  const totalProgress = useMemo(() => {
    if (savedPlaylists.length === 0) return 0;
    const completedData = getCompletedDataSafe();
    let totalVideos = 0;
    let totalDone = 0;
    savedPlaylists.forEach((pl) => {
      totalVideos += pl.videos.length;
      totalDone += (completedData[pl.playlistId] || []).length;
    });
    return totalVideos === 0 ? 0 : Math.round((totalDone / totalVideos) * 100);
  }, [savedPlaylists]);

  const completedPlaylistCount = useMemo(() => {
    const completedData = getCompletedDataSafe();
    return savedPlaylists.filter(
      (pl) =>
        pl.videos.length > 0 &&
        (completedData[pl.playlistId] || []).length === pl.videos.length,
    ).length;
  }, [savedPlaylists]);

  const completedVideoCount = useMemo(() => {
    const completedData = getCompletedDataSafe();
    return savedPlaylists.reduce(
      (total, playlist) => total + (completedData[playlist.playlistId] || []).length,
      0,
    );
  }, [savedPlaylists]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return savedPlaylists;
    const q = searchQuery.toLowerCase();
    return savedPlaylists.filter((pl) =>
      pl.playlistTitle.toLowerCase().includes(q),
    );
  }, [savedPlaylists, searchQuery]);

  const favoritePlaylists = useMemo(
    () => savedPlaylists.filter((pl) => favorites.includes(pl.playlistId)),
    [savedPlaylists, favorites],
  );

  const loadButtonText = isLoading
    ? "Loading…"
    : inputMatchesLoaded
      ? lecturesVisible
        ? "Hide lectures"
        : "Show lectures"
      : "Load Playlist";

  const navItems = [
    { id: "home", label: "Home", icon: Home, color: "pink" },
    { id: "playlists", label: "My Playlists", icon: ListVideo, color: "blue" },
    { id: "favorites", label: "Favorites", icon: Heart, color: "yellow" },
    { id: "notes", label: "Notes", icon: NotebookPen, color: "green" },
    { id: "progress", label: "Progress", icon: BarChart3, color: "yellow" },
    { id: "settings", label: "Settings", icon: Settings, color: "blue" },
  ];

  return (
    <div className="app-layout">
      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="topbar-left-cluster">
          <button
            className="topbar-hamburger"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <a className="topbar-logo" href="/">
            <div className="logo-play-box">
              <Play size={16} fill="#000" color="#000" />
            </div>
            <span className="logo-text">StudyShelf</span>
          </a>
        </div>

        <div className="topbar-search">
          <Search size={16} className="search-icon" />
          <input
            id="global-search"
            type="text"
            placeholder="Search playlists, topics, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-kbd">/</span>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="topbar-user-badge" onClick={logout} title="Sign out">
            <div className="user-avatar-box">A</div>
            <span className="user-email-text">{user?.email || "myteam034221@gmail.com"}</span>
            <ChevronDown size={14} className="user-chevron" />
          </button>
        </div>
      </header>

      {/* ── APP BODY: SIDEBAR + MAIN AREA ── */}
      <div className="app-body">
        <button
          className={cx("sidebar-scrim", isSidebarOpen && "is-visible")}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
        <aside className={cx("sidebar", isSidebarOpen && "is-open")}>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cx("sidebar-nav-item", activeNav === item.id && "is-active")}
                  onClick={() => {
                    setActiveNav(item.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* My Learning progress */}
          <div className="sidebar-learning">
            <div className="sidebar-learning-header">
              MY LEARNING
            </div>
            {completedVideoCount > 0 ? (
              <>
                <div className="circular-progress-container">
                  <CircularProgress percent={totalProgress} color="var(--neo-yellow)" />
                </div>
                <p className="sidebar-learning-stat">
                  {completedPlaylistCount} of {savedPlaylists.length} playlists<br />completed
                </p>
              </>
            ) : (
              <div className="sidebar-no-progress">
                <BarChart3 size={25} />
                <strong>No progress yet</strong>
                <span>Complete a video to see your learning progress.</span>
              </div>
            )}
          </div>

          {/* ORGANIZE LEARN GROW Box */}
          <button
            type="button"
            className="sidebar-bottom-card"
            onClick={() => {
              setActiveNav("learning-ladder");
              setIsSidebarOpen(false);
            }}
            aria-label="Organize your learning order"
          >
            <div className="sidebar-motto-stack">
              <div className="sidebar-motto-word">ORGANIZE</div>
              <div className="sidebar-motto-word">LEARN</div>
              <div className="sidebar-motto-word">GROW</div>
            </div>
            <div className="sidebar-motto-arrow">
              →
            </div>
          </button>
        </aside>

        {/* ── MAIN AREA ── */}
        <main className="main-area">
          {activeNav === "home" && (
            <HomeView
              playlistInput={playlistInput}
              setPlaylistInput={setPlaylistInput}
              handleLoadLectures={handleLoadLectures}
              isLoading={isLoading}
              loadButtonText={loadButtonText}
              inputMatchesLoaded={inputMatchesLoaded}
              lecturesVisible={lecturesVisible}
              currentPlaylist={currentPlaylist}
              clearLoadedLectures={clearLoadedLectures}
              savePlaylist={savePlaylist}
              status={status}
              savedPlaylists={filteredPlaylists}
              openSavedPlaylist={openSavedPlaylist}
              deleteSavedPlaylist={deleteSavedPlaylist}
              handleToggleFavorite={handleToggleFavorite}
              favorites={favorites}
              openLecture={openLecture}
              onViewAll={() => setActiveNav("playlists")}
            />
          )}
          {activeNav === "playlists" && (
            <PlaylistsView
              playlists={filteredPlaylists}
              onOpen={openSavedPlaylist}
              onDelete={deleteSavedPlaylist}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
            />
          )}
          {activeNav === "favorites" && (
            <FavoritesView
              playlists={favoritePlaylists}
              onOpen={openSavedPlaylist}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeNav === "notes" && <NotesView playlists={savedPlaylists} />}
          {activeNav === "progress" && (
            <ProgressView
              playlists={savedPlaylists}
              totalProgress={totalProgress}
              completedCount={completedPlaylistCount}
            />
          )}
          {activeNav === "learning-ladder" && (
            <LearningLadderView
              playlists={savedPlaylists}
              ladderIds={learningLadderIds}
              onChange={updateLearningLadder}
            />
          )}
          {activeNav === "settings" && (
            <SettingsView
              user={user}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onLogout={logout}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── HOME VIEW ─── */
function HomeView({
  playlistInput,
  setPlaylistInput,
  handleLoadLectures,
  isLoading,
  loadButtonText,
  inputMatchesLoaded,
  lecturesVisible,
  currentPlaylist,
  clearLoadedLectures,
  savePlaylist,
  status,
  savedPlaylists,
  openSavedPlaylist,
  deleteSavedPlaylist,
  handleToggleFavorite,
  favorites,
  openLecture,
  onViewAll,
}) {
  return (
    <div className="home-view">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">
            YOUR STUDY SPACE —
          </p>
          <h1 className="hero-title">
            MAKE EVERY<br />LECTURE COUNT.
          </h1>
          <p className="hero-desc">
            Bring in a YouTube playlist or video, pick up where you left off, and keep
            your learning organised.
          </p>

          {/* Floating Add Playlist Card with Purple Tab */}
          <div className="hero-input-container">
            <div className="hero-tab">
              ADD PLAYLIST OR VIDEO
            </div>
            <div className="hero-input-box">
              <div className="hero-input-row">
                <Link2 size={18} className="hero-link-icon" />
                <input
                  type="text"
                  placeholder="Paste a YouTube playlist or video link here..."
                  value={playlistInput}
                  onChange={(e) => setPlaylistInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLoadLectures();
                  }}
                />
                <button
                  type="button"
                  onClick={handleLoadLectures}
                  disabled={isLoading}
                  className="hero-load-btn"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {loadButtonText}
                </button>
              </div>
              <div className="hero-badges">
                <span className="hero-badge badge-yellow">
                  <Zap size={13} fill="#000" /> No ads
                </span>
                <span className="hero-badge badge-green">
                  <Lock size={13} /> Free to use
                </span>
                <span className="hero-badge badge-purple">
                  <Users size={13} /> Built for learners
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand-Drawn Illustration Cards */}
        <div className="hero-art-area">
          <div className="hero-sunburst">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="hero-card hero-card-yt">
            <div className="hero-card-header">
              <div className="yt-brand">
                <span className="yt-icon-box">
                  <Play size={8} fill="#fff" color="#fff" />
                </span>
                <span className="yt-title">YouTube</span>
              </div>
              <span className="yt-popout">↗</span>
            </div>
            <div className="yt-rows">
              <div className="yt-row">
                <div className="yt-thumb"><Play size={7} fill="#fff" color="#fff" /></div>
                <div className="yt-lines"><div className="yt-line-1"></div><div className="yt-line-2"></div></div>
              </div>
              <div className="yt-row">
                <div className="yt-thumb"><Play size={7} fill="#fff" color="#fff" /></div>
                <div className="yt-lines"><div className="yt-line-1"></div><div className="yt-line-2"></div></div>
              </div>
              <div className="yt-row">
                <div className="yt-thumb"><Play size={7} fill="#fff" color="#fff" /></div>
                <div className="yt-lines"><div className="yt-line-1"></div><div className="yt-line-2"></div></div>
              </div>
            </div>
          </div>

          <div className="hero-curved-arrow">
            <svg width="45" height="35" viewBox="0 0 45 35" fill="none">
              <path d="M5 26 C14 8, 30 6, 40 18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M33 18 L40 18 L38 11" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="hero-card hero-card-playlists">
            <div className="hero-card-header">
              <span className="playlists-title">MY PLAYLISTS</span>
              <span className="playlists-arrow">→</span>
            </div>
            <div className="playlists-rows">
              <div className="playlists-row">
                <div className="row-badge">&lt;/&gt;</div>
                <div className="row-content">
                  <div className="row-lines"><div className="row-line-1"></div><div className="row-line-2"></div></div>
                  <div className="row-progress"><div className="row-progress-fill fill-purple"></div></div>
                </div>
              </div>
              <div className="playlists-row">
                <div className="row-badge badge-brain">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2h8v2H4zM2 4h12v4H2zM2 8h4v6H2zM10 8h4v6h-4zM6 8h4v4H6z" />
                  </svg>
                </div>
                <div className="row-content">
                  <div className="row-lines"><div className="row-line-1"></div><div className="row-line-2"></div></div>
                  <div className="row-progress"><div className="row-progress-fill fill-teal"></div></div>
                </div>
              </div>
              <div className="playlists-row">
                <div className="row-badge badge-chart">
                  <BarChart3 size={11} />
                </div>
                <div className="row-content">
                  <div className="row-lines"><div className="row-line-1"></div><div className="row-line-2"></div></div>
                  <div className="row-progress"><div className="row-progress-fill fill-coral"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loaded playlist actions */}
      {currentPlaylist && (
        <div className="loaded-actions">
          <button
            type="button"
            onClick={clearLoadedLectures}
            className="btn btn-ghost"
          >
            <X size={16} /> Clear
          </button>
          <button
            type="button"
            onClick={savePlaylist}
            className="btn btn-secondary"
          >
            <Save size={16} /> Save {currentPlaylist.sourceType === "video" ? "video" : "playlist"}
          </button>
        </div>
      )}
      {status.message && <StatusMessage status={status} />}

      {/* Loaded lectures */}
      <LectureResults
        playlist={currentPlaylist}
        visible={lecturesVisible}
        onOpen={openLecture}
      />

      {/* Recently Added section */}
      {savedPlaylists.length > 0 && (
        <section className="recently-added">
          <div className="section-header-brutal">
            <div className="section-title-wrapper">
              <span className="burst-rays">
                <span>\</span>
                <span>—</span>
                <span>/</span>
              </span>
              <h2>RECENTLY ADDED</h2>
            </div>
            <div className="section-divider-line"></div>
            <button className="view-all-btn" type="button" onClick={onViewAll}>
              View all →
            </button>
          </div>
          <div className="playlist-cards">
            {savedPlaylists.slice(0, 6).map((playlist, index) => {
              const progress = getPlaylistProgress(playlist);
              const isFav = favorites.includes(playlist.playlistId);
              return (
                <PlaylistCard
                  key={playlist.playlistId}
                  playlist={playlist}
                  progress={progress}
                  isFav={isFav}
                  onOpen={() => openSavedPlaylist(playlist)}
                  onDelete={() => deleteSavedPlaylist(playlist.playlistId)}
                  onToggleFav={() => handleToggleFavorite(playlist.playlistId)}
                  index={index}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Playlist Card ─── */
function PlaylistCard({ playlist, progress, isFav, onOpen, onDelete, onToggleFav, index }) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const cardConfigs = [
    {
      name: "pink",
      bg: "#ff7782",
      badgeCount: "150 videos",
      centerArt: "DSA",
      author: playlist.channelTitle || "Striver",
      progressColor: "#7c69ef",
      showWaves: true,
    },
    {
      name: "green",
      bg: "#4ecdc4",
      badgeCount: "120 videos",
      centerArt: "</>",
      author: playlist.channelTitle || "Apna College",
      progressColor: "#4ecdc4",
      showWaves: false,
    },
    {
      name: "purple",
      bg: "#b8a9e8",
      badgeCount: "80 videos",
      centerArt: "BRAIN",
      author: playlist.channelTitle || "freeCodeCamp",
      progressColor: "#ff6b6b",
      showWaves: false,
    },
  ];
  const config = cardConfigs[index % cardConfigs.length];
  const videoCount = playlist.sourceType === "video"
    ? "1 video"
    : playlist.videos?.length > 0
      ? `${playlist.videos.length} videos`
      : config.badgeCount;

  return (
    <div className={`playlist-card card-theme-${config.name}`}>
      <div
        className="playlist-card-thumb"
        style={{ background: config.bg }}
        onClick={onOpen}
      >
        <span className="card-video-pill">
          {videoCount}
        </span>

        {/* 3-dots action button top right */}
        <div className="card-top-actions">
          <button
            type="button"
            className="card-more-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsActionMenuOpen((isOpen) => !isOpen);
            }}
            aria-label="Open playlist actions"
            aria-expanded={isActionMenuOpen}
            aria-haspopup="menu"
            title="Playlist actions"
          >
            <EllipsisVertical size={17} aria-hidden="true" />
          </button>
          {isActionMenuOpen && (
            <div
              className="card-action-menu"
              role="menu"
              aria-label={`Actions for ${playlist.playlistTitle}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  onOpen();
                }}
              >
                Open playlist
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleFav();
                  setIsActionMenuOpen(false);
                }}
              >
                {isFav ? "Remove from favorites" : "Add to favorites"}
              </button>
            </div>
          )}
          {onDelete && <button
            type="button"
            className="card-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Remove from library"
            aria-label={`Remove ${playlist.playlistTitle} from library`}
          >
            <Trash2 size={14} />
          </button>}
        </div>

        {/* Center Artwork */}
        <div className="card-center-art">
          {config.centerArt === "DSA" && (
            <span className="art-dsa">DSA</span>
          )}
          {config.centerArt === "</>" && (
            <span className="art-code">&lt;/&gt;</span>
          )}
          {config.centerArt === "BRAIN" && (
            <svg className="art-brain-svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
              <path d="M12 4v16M8 4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4M16 4a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4" strokeWidth="2" />
              <path d="M8 8h1M8 12h2M7 16h2M15 8h1M14 12h2M15 16h2" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Contour wavy lines on pink card */}
        {config.showWaves && (
          <div className="card-waves">
            <svg viewBox="0 0 120 60" fill="none">
              <path d="M0 30 C30 10, 60 40, 90 20 C105 10, 115 25, 120 30" stroke="#000" strokeWidth="1.5" />
              <path d="M0 42 C30 22, 60 52, 90 32 C105 22, 115 37, 120 42" stroke="#000" strokeWidth="1.5" />
              <path d="M0 54 C30 34, 60 64, 90 44 C105 34, 115 49, 120 54" stroke="#000" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      <div className="playlist-card-body" onClick={onOpen}>
        <h3 className="playlist-card-title">{playlist.playlistTitle}</h3>
        <p className="playlist-card-author">{playlist.channelTitle || config.author}</p>
        <div className="playlist-card-progress-row">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progress.percent}%`,
                background: config.progressColor,
              }}
            />
          </div>
          <span className="progress-pct-text">{progress.percent}%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── PLAYLISTS VIEW ─── */
function PlaylistsView({ playlists, onOpen, onDelete, onToggleFavorite, favorites }) {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1>My Playlists</h1>
        <p className="view-desc">{playlists.length} playlists in your library</p>
      </div>
      {playlists.length === 0 ? (
        <div className="empty-state">
          <ListVideo size={40} />
          <h3>No playlists yet</h3>
          <p>Go to Home and add a YouTube playlist to get started.</p>
        </div>
      ) : (
        <div className="playlist-cards">
          {playlists.map((playlist, index) => {
            const progress = getPlaylistProgress(playlist);
            return (
              <PlaylistCard
                key={playlist.playlistId}
                playlist={playlist}
                progress={progress}
                isFav={favorites.includes(playlist.playlistId)}
                onOpen={() => onOpen(playlist)}
                onDelete={() => onDelete(playlist.playlistId)}
                onToggleFav={() => onToggleFavorite(playlist.playlistId)}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── FAVORITES VIEW ─── */
function FavoritesView({ playlists, onOpen, onToggleFavorite }) {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Favorites</h1>
        <p className="view-desc">Your favorite playlists for quick access</p>
      </div>
      {playlists.length === 0 ? (
        <div className="empty-state">
          <Heart size={40} />
          <h3>No favorites yet</h3>
          <p>Heart a playlist to add it to your favorites.</p>
        </div>
      ) : (
        <div className="playlist-cards">
          {playlists.map((playlist, index) => {
            const progress = getPlaylistProgress(playlist);
            return (
              <PlaylistCard
                key={playlist.playlistId}
                playlist={playlist}
                progress={progress}
                isFav={true}
                onOpen={() => onOpen(playlist)}
                onDelete={null}
                onToggleFav={() => onToggleFavorite(playlist.playlistId)}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── NOTES VIEW ─── */
function NotesView({ playlists }) {
  const allNotes = getAllNotes();
  const noteEntries = [];
  playlists.forEach((pl) => {
    const playlistNotes = allNotes[pl.playlistId];
    if (playlistNotes) {
      Object.entries(playlistNotes).forEach(([videoIdx, text]) => {
        const video = pl.videos[Number(videoIdx)];
        noteEntries.push({
          playlistTitle: pl.playlistTitle,
          videoTitle: video?.title || `Video ${Number(videoIdx) + 1}`,
          text,
          key: `${pl.playlistId}-${videoIdx}`,
        });
      });
    }
  });

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Notes</h1>
        <p className="view-desc">{noteEntries.length} notes across your playlists</p>
      </div>
      {noteEntries.length === 0 ? (
        <div className="empty-state">
          <NotebookPen size={40} />
          <h3>No notes yet</h3>
          <p>Take notes while watching lectures in the player.</p>
        </div>
      ) : (
        <div className="notes-list">
          {noteEntries.map((entry) => (
            <div key={entry.key} className="note-card note-card-playful">
              <div className="note-card-header">
                <span className="note-card-playlist pill-blue">{entry.playlistTitle}</span>
                <span className="note-card-video">{entry.videoTitle}</span>
              </div>
              <p className="note-card-text">{entry.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PROGRESS VIEW ─── */
function ProgressView({ playlists, totalProgress, completedCount }) {
  const completedData = getCompletedDataSafe();
  const totalVideos = playlists.reduce((sum, pl) => sum + pl.videos.length, 0);
  const totalDone = playlists.reduce(
    (sum, pl) => sum + (completedData[pl.playlistId] || []).length,
    0,
  );

  if (totalDone === 0) {
    return (
      <div className="view-container">
        <div className="view-header">
          <h1>Progress</h1>
          <p className="view-desc">Track your learning journey</p>
        </div>
        <div className="empty-state no-progress-state">
          <BarChart3 size={40} />
          <h3>No progress yet</h3>
          <p>
            {playlists.length
              ? "Complete a video to start building your learning history."
              : "Save a playlist or a video, then start learning to see progress here."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Progress</h1>
        <p className="view-desc">Track your learning journey</p>
      </div>
      <div className="progress-overview">
        <div className="progress-stat-card card-accent-green">
          <CircularProgress percent={totalProgress} size={100} color="var(--play-green)" />
          <div>
            <h3>Overall Progress</h3>
            <p>{totalDone} of {totalVideos} videos completed</p>
          </div>
        </div>
        <div className="progress-stat-card stat-mini card-accent-blue">
          <div className="stat-number color-blue">{playlists.length}</div>
          <p>Total Playlists</p>
        </div>
        <div className="progress-stat-card stat-mini card-accent-green">
          <div className="stat-number color-green">{completedCount}</div>
          <p>Completed</p>
        </div>
        <div className="progress-stat-card stat-mini card-accent-yellow">
          <div className="stat-number color-yellow">{countAllNotes()}</div>
          <p>Notes Taken</p>
        </div>
      </div>
      {playlists.length > 0 && (
        <div className="progress-breakdown">
          <h2>Per Playlist</h2>
          {playlists.map((pl, idx) => {
            const prog = getPlaylistProgress(pl);
            const fillColors = ["var(--play-blue)", "var(--play-green)", "var(--play-yellow)", "var(--accent-pink)"];
            return (
              <div key={pl.playlistId} className="progress-row">
                <span className="progress-row-title">{pl.playlistTitle}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${prog.percent}%`,
                      background: fillColors[idx % fillColors.length],
                    }}
                  />
                </div>
                <span className="progress-row-pct">{prog.percent}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── LEARNING LADDER VIEW ─── */
function LearningLadderView({ playlists, ladderIds, onChange }) {
  const [draggedPlaylistId, setDraggedPlaylistId] = useState(null);
  const playlistsById = useMemo(
    () => new Map(playlists.map((playlist) => [playlist.playlistId, playlist])),
    [playlists],
  );
  const plannedIds = ladderIds.filter((playlistId) => playlistsById.has(playlistId));
  const plannedIdSet = new Set(plannedIds);

  function getDraggedId(event) {
    return event.dataTransfer.getData("text/plain") || draggedPlaylistId;
  }

  function startDrag(event, playlistId) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", playlistId);
    setDraggedPlaylistId(playlistId);
  }

  function placeAt(event, position) {
    event.preventDefault();
    const playlistId = getDraggedId(event);
    if (!playlistId || !playlistsById.has(playlistId)) return;
    const withoutPlaylist = plannedIds.filter((id) => id !== playlistId);
    const next = [...withoutPlaylist];
    next.splice(Math.min(position, next.length), 0, playlistId);
    onChange(next);
    setDraggedPlaylistId(null);
  }

  function removeFromLadder(playlistId) {
    onChange(plannedIds.filter((id) => id !== playlistId));
  }

  return (
    <div className="view-container learning-ladder-view">
      <div className="view-header learning-ladder-header">
        <div>
          <p className="section-eyebrow">YOUR STUDY PATH</p>
          <h1>Learning Ladder</h1>
          <p className="view-desc">Drag saved playlists onto the ladder in the order you want to learn them.</p>
        </div>
        <span className="ladder-count">{plannedIds.length} planned</span>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <ListVideo size={40} />
          <h3>No saved playlists yet</h3>
          <p>Save a playlist from Home, then come back to build your learning order.</p>
        </div>
      ) : (
        <div className="learning-ladder-layout">
          <aside
            className="ladder-library"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const playlistId = getDraggedId(event);
              if (playlistId) removeFromLadder(playlistId);
              setDraggedPlaylistId(null);
            }}
          >
            <div className="ladder-library-head">
              <h2>Saved playlists</h2>
              <span>{playlists.length}</span>
            </div>
            <p>Drag a playlist onto a rung. Drop it back here to remove it from your plan.</p>
            <div className="ladder-library-list">
              {playlists.map((playlist) => (
                <button
                  key={playlist.playlistId}
                  type="button"
                  draggable
                  className={cx("ladder-library-item", plannedIdSet.has(playlist.playlistId) && "is-planned")}
                  onDragStart={(event) => startDrag(event, playlist.playlistId)}
                  onDragEnd={() => setDraggedPlaylistId(null)}
                  title="Drag to the learning ladder"
                >
                  <span className="ladder-grip" aria-hidden="true">⠿</span>
                  <span className="ladder-library-item-copy">
                    <strong>{playlist.playlistTitle}</strong>
                    <small>{playlist.videos.length} videos{plannedIdSet.has(playlist.playlistId) ? " · on ladder" : ""}</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="learning-ladder" aria-label="Your learning order">
            <div className="ladder-intro">
              <span>START HERE</span>
              <p>Build one clear path, one playlist at a time.</p>
            </div>
            <div className="ladder-steps">
              <button
                type="button"
                className={cx("ladder-drop-zone", plannedIds.length === 0 && "is-first")}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => placeAt(event, 0)}
              >
                {plannedIds.length === 0 ? "Drop your first playlist here" : "Drop here to make this step 1"}
              </button>

              {plannedIds.map((playlistId, index) => {
                const playlist = playlistsById.get(playlistId);
                return (
                  <React.Fragment key={playlistId}>
                    <article
                      className="ladder-step"
                      draggable
                      onDragStart={(event) => startDrag(event, playlistId)}
                      onDragEnd={() => setDraggedPlaylistId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => placeAt(event, index)}
                    >
                      <span className="ladder-step-number">{String(index + 1).padStart(2, "0")}</span>
                      <div className="ladder-step-copy">
                        <span>STEP {index + 1}</span>
                        <h2>{playlist.playlistTitle}</h2>
                        <p>{playlist.channelTitle || "YouTube Creator"} · {playlist.videos.length} videos</p>
                      </div>
                      <button
                        type="button"
                        className="ladder-remove-btn"
                        onClick={() => removeFromLadder(playlistId)}
                        aria-label={`Remove ${playlist.playlistTitle} from learning ladder`}
                        title="Remove from ladder"
                      >
                        ×
                      </button>
                    </article>
                    <button
                      type="button"
                      className="ladder-drop-zone ladder-next-zone"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => placeAt(event, index + 1)}
                    >
                      Drop next playlist here
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* ─── SETTINGS VIEW ─── */
function SettingsView({ user, theme, onToggleTheme, onLogout }) {
  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Settings</h1>
        <p className="view-desc">Manage your preferences</p>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>Account</h3>
          <div className="settings-row">
            <span>Email</span>
            <span className="settings-value">{user.email}</span>
          </div>
        </div>
        <div className="settings-card">
          <h3>Appearance</h3>
          <div className="settings-row">
            <span>Theme</span>
            <button className="btn btn-secondary" onClick={onToggleTheme}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
        <div className="settings-card">
          <h3>Session</h3>
          <div className="settings-row">
            <span>Sign out from this device</span>
            <button className="btn btn-danger" onClick={onLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared: ThemeToggle ─── */
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={cx("theme-toggle", isDark ? "is-dark" : "is-light")}
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={17} className="icon-sun" /> : <Moon size={17} className="icon-moon" />}
    </button>
  );
}

/* ─── Shared: CircularProgress ─── */
function CircularProgress({ percent = 0, size = 80, color = "#f5d547" }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;
  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background track circle with black border */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0ded6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
        />
        {/* Progress arc in vibrant yellow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth - 1}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="circular-progress-text">{percent}%</span>
    </div>
  );
}

/* ─── Shared: StatusMessage ─── */
function StatusMessage({ status }) {
  return (
    <p className={cx("status-message", `status-${status.tone}`)} role="status">
      {status.message}
    </p>
  );
}

/* ─── Shared: LectureResults ─── */
function LectureResults({ playlist, visible, onOpen }) {
  if (!playlist || !visible) return null;
  return (
    <section className="lecture-results" aria-labelledby="lectures-heading">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">PLAYLIST</p>
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

/* ═══════════════════════════════════════════════
   PLAYER PAGE
   ═══════════════════════════════════════════════ */
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
  const [noteText, setNoteText] = useState("");
  const [videoWatchProgress, setVideoWatchProgress] = useState({
    watchedSeconds: 0,
    duration: 0,
  });
  const activeVideoId = videos[currentIndex]?.videoId;

  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) selectVideo(0);
  }, [currentIndex, videos.length]);

  useEffect(() => {
    if (playlistId) {
      const notes = getNotesForPlaylist(playlistId);
      setNoteText(notes[currentIndex] || "");
    }
  }, [currentIndex, playlistId]);

  useEffect(() => {
    setVideoWatchProgress(getVideoProgress(activeVideoId));
  }, [activeVideoId]);

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
  const hasPlaylistQueue = videos.length > 1;
  const watchedPercent = isCurrentComplete
    ? 100
    : videoWatchProgress.duration > 0
      ? Math.min(100, Math.round((videoWatchProgress.watchedSeconds / videoWatchProgress.duration) * 100))
      : 0;

  function selectVideo(index) {
    setCurrentIndex(index);
    setSearchParams({ index: String(index) });
  }

  function toggleComplete() {
    const isBecomingComplete = !isCurrentComplete;
    const nextCompleted = isCurrentComplete
      ? completed.filter((index) => index !== currentIndex)
      : [...completed, currentIndex];
    setCompletedData(setCompletedForPlaylist(playlistId, nextCompleted));
    const progress = setVideoProgress(
      activeVideoId,
      isBecomingComplete ? videoWatchProgress.duration : 0,
      videoWatchProgress.duration,
      { replace: true },
    );
    setVideoWatchProgress(progress);
  }

  function handleDoubtSubmit() {
    const question = doubtText.trim();
    if (!question) {
      setDoubtResponse({ tone: "error", message: "Type a question first." });
      return;
    }
    setDoubtResponse({
      tone: "success",
      message: `Your question has been noted: "${question}"`,
    });
    setDoubtText("");
  }

  function handleNoteSave() {
    setNoteForVideo(playlistId, currentIndex, noteText);
    setDoubtResponse({ tone: "success", message: "Note saved!" });
    setTimeout(() => setDoubtResponse({ tone: "muted", message: "" }), 2000);
  }

  function handleVideoProgress(currentTime, duration) {
    const progress = setVideoProgress(
      activeVideoId,
      isCurrentComplete ? duration : currentTime,
      duration,
      { replace: isCurrentComplete },
    );
    setVideoWatchProgress(progress);
  }

  function closePlayer() {
    window.close();
    window.setTimeout(() => navigate("/"), 150);
  }

  return (
    <div className={cx("player-shell", !hasPlaylistQueue && "is-single-video")}>
      {hasPlaylistQueue && <aside className="player-sidebar">
        <div className="player-sidebar-head">
          <div>
            <p className="section-eyebrow">NOW STUDYING</p>
            <h1>{playlistData.playlistTitle}</h1>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div className="player-progress">
          <div className="progress-copy">
            <span>Course progress</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
      </aside>}
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
                "btn",
                isCurrentComplete ? "btn-ghost is-done" : "btn-3d-green",
              )}
            >
              <Check size={16} />
              {isCurrentComplete ? "Mark incomplete" : "Mark complete"}
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
          <div className="watch-heading">
            <div>
          <p className="section-eyebrow">
            LECTURE {String(currentIndex + 1).padStart(2, "0")}
          </p>
          <h2>{currentVideo?.title || "Loading…"}</h2>
            </div>
            <div className="video-watch-progress" aria-label={`Video progress: ${watchedPercent}% watched`}>
              <div className="video-watch-copy">
                <span>Watch progress</span>
                <strong>{formatWatchTime(videoWatchProgress.watchedSeconds)} / {formatWatchTime(videoWatchProgress.duration)}</strong>
              </div>
              <div className="video-watch-track">
                <div className="video-watch-fill" style={{ width: `${watchedPercent}%` }} />
              </div>
              <span className="video-watch-percent">{watchedPercent}% watched</span>
            </div>
          </div>
          <div className="video-frame">
            {currentVideo && (
              <YouTubeStudyPlayer
                video={currentVideo}
                onProgress={handleVideoProgress}
              />
            )}
          </div>
        </section>
        <div className="player-study-scroll">
          {/* Notes area */}
          <section className="note-area">
            <div className="note-area-header">
              <NotebookPen size={18} />
              <strong>Lecture Notes</strong>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your notes for this lecture..."
              className="note-textarea"
            />
            <button type="button" className="btn btn-3d-yellow" onClick={handleNoteSave}>
              <Save size={15} /> Save Note
            </button>
          </section>
          {/* Doubt/Question area */}
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
              {isDoubtOpen ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
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
                  className="btn btn-3d-blue"
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
        </div>
      </main>
    </div>
  );
}

let youTubeApiPromise;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-studyshelf-youtube-api]');
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };

    if (existingScript) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.studyshelfYoutubeApi = "true";
    script.onerror = () => reject(new Error("Unable to load the YouTube player."));
    document.head.appendChild(script);
  });

  return youTubeApiPromise;
}

function YouTubeStudyPlayer({ video, onProgress }) {
  const mountRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    let player;
    let intervalId;
    let isDisposed = false;

    const reportProgress = () => {
      const duration = Number(player?.getDuration?.()) || 0;
      const currentTime = Number(player?.getCurrentTime?.()) || 0;
      if (duration > 0) onProgressRef.current(currentTime, duration);
    };
    const startTracking = () => {
      window.clearInterval(intervalId);
      reportProgress();
      intervalId = window.setInterval(reportProgress, 1000);
    };

    loadYouTubeApi()
      .then((YT) => {
        if (isDisposed || !mountRef.current) return;
        player = new YT.Player(mountRef.current, {
          videoId: video.videoId,
          playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
          events: {
            onReady: reportProgress,
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) startTracking();
              if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                reportProgress();
                window.clearInterval(intervalId);
              }
            },
          },
        });
      })
      .catch(() => {});

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
      player?.destroy?.();
    };
  }, [video.videoId]);

  return <div ref={mountRef} className="youtube-player-host" title={video.title} />;
}

function EmptyPlayerState({ onBack, theme, onToggleTheme }) {
  return (
    <div className="empty-player">
      <div className="empty-player-bar">
        <a className="sidebar-brand" href="/">
          <span className="sidebar-brand-icon">
            <Play size={16} fill="#fff" />
          </span>
          <span>StudyShelf</span>
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
        <button type="button" onClick={onBack} className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to library
        </button>
      </div>
    </div>
  );
}

export default App;
