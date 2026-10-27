import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
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
  fetchPlaylistTitle,
  fetchPlaylistVideos,
} from "./services/youtube";
import {
  getCompletedDataSafe,
  getCurrentPlaylist,
  getPlaylistProgress,
  getSavedPlaylists,
  getFavorites,
  toggleFavorite,
  isFavorite,
  getAllNotes,
  countAllNotes,
  setCompletedForPlaylist,
  setCurrentPlaylist,
  setSavedPlaylists,
  setNoteForVideo,
  getNotesForPlaylist,
} from "./utils/storage";
import { useAuth } from "./auth.jsx";

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
              Study<span className="brand-gradient">Shelf</span>
            </h1>
            <p>
              Your personal study space. Bring in YouTube playlists, track
              progress, and keep your learning organized.
            </p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <Zap size={16} />
                <span>No ads, pure focus</span>
              </div>
              <div className="auth-feature-item">
                <Shield size={16} />
                <span>Free to use, forever</span>
              </div>
              <div className="auth-feature-item">
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
      const playlist = { playlistId, playlistTitle, videos, addedAt: Date.now() };
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
        message: "Couldn't load this playlist. Check the link and try again.",
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
    { id: "home", label: "Home", icon: Home },
    { id: "playlists", label: "My Playlists", icon: ListVideo },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "notes", label: "Notes", icon: NotebookPen },
    { id: "progress", label: "Progress", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="app-layout">
      {/* ── SIDEBAR ── */}
      <button
        className={cx("sidebar-scrim", isSidebarOpen && "is-visible")}
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Close sidebar"
      />
      <aside className={cx("sidebar", isSidebarOpen && "is-open")}>
        <a className="sidebar-brand" href="/">
          <span className="sidebar-brand-icon">
            <Play size={16} fill="#fff" />
          </span>
          <span className="sidebar-brand-text">StudyShelf</span>
        </a>
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
            <span>My Learning</span>
            <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
          </div>
          <div className="circular-progress-container">
            <CircularProgress percent={totalProgress} />
          </div>
          <p className="sidebar-learning-stat">
            {completedPlaylistCount} of {savedPlaylists.length} playlists
            completed
          </p>
        </div>

        <div className="sidebar-bottom-card">
          <p className="sidebar-motto">Organize</p>
          <p className="sidebar-motto">Learn</p>
          <p className="sidebar-motto">Grow</p>
          <div className="sidebar-motto-arrow">
            <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <button
            className="topbar-hamburger"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-search">
            <Search size={16} />
            <input
              id="global-search"
              type="text"
              placeholder="Search playlists, topics, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="topbar-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="topbar-user">
              <div className="topbar-avatar">
                {(user.email || "U")[0].toUpperCase()}
              </div>
              <span className="topbar-email">{user.email}</span>
              <ChevronDown size={14} />
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="main-content">
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
}) {
  return (
    <div className="home-view">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <p className="hero-eyebrow">YOUR STUDY SPACE</p>
          <h1 className="hero-title">
            Make every <span className="gradient-text">lecture</span> count.
          </h1>
          <p className="hero-desc">
            Bring in a YouTube playlist, pick up where you left off, and keep
            your learning organised.
          </p>
          {/* Playlist input */}
          <div className="hero-input-row">
            <div className="hero-input-wrapper">
              <Link2 size={18} />
              <input
                type="text"
                placeholder="Paste YouTube playlist or channel link here..."
                value={playlistInput}
                onChange={(e) => setPlaylistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLoadLectures();
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleLoadLectures}
              disabled={isLoading}
              className="hero-load-btn"
            >
              {isLoading ? (
                <Loader2 size={17} className="spin" />
              ) : (
                <Plus size={17} />
              )}
              {loadButtonText}
            </button>
          </div>
          {/* Feature badges */}
          <div className="hero-badges">
            <span className="hero-badge">
              <Zap size={14} /> No ads
            </span>
            <span className="hero-badge">
              <Lock size={14} /> Free to use
            </span>
            <span className="hero-badge">
              <Sparkles size={14} /> Built for learners
            </span>
          </div>
        </div>
        <div className="hero-image">
          <img src="/hero.jpg" alt="StudyShelf illustration" />
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
            <Save size={16} /> Save to library
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
          <div className="section-header">
            <h2>Recently Added</h2>
            <button className="view-all-btn" type="button">
              View all <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
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
                  onDelete={() => deleteSavedPlaylist(index)}
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
  // Colors for card accent
  const colors = [
    "linear-gradient(135deg, #667eea, #764ba2)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #22c55e, #14b8a6)",
    "linear-gradient(135deg, #ec4899, #8b5cf6)",
    "linear-gradient(135deg, #6366f1, #06b6d4)",
  ];
  return (
    <div className="playlist-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div
        className="playlist-card-thumb"
        style={{ background: colors[index % colors.length] }}
        onClick={onOpen}
      >
        <div className="playlist-card-icon">
          <Play size={22} fill="#fff" />
        </div>
        <div className="playlist-card-actions-top">
          <button
            type="button"
            className="card-action-btn"
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            aria-label="Toggle favorite"
          >
            <Heart size={14} fill={isFav ? "#ec4899" : "none"} color={isFav ? "#ec4899" : "#fff"} />
          </button>
          <button
            type="button"
            className="card-action-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete playlist"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="playlist-card-body" onClick={onOpen}>
        <h3 className="playlist-card-title">{playlist.playlistTitle}</h3>
        <p className="playlist-card-meta">
          <ListVideo size={13} /> {playlist.videos.length} videos
        </p>
        <div className="playlist-card-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="progress-label">{progress.percent}%</span>
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
                onDelete={() => onDelete(index)}
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
                onDelete={() => {}}
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
            <div key={entry.key} className="note-card">
              <div className="note-card-header">
                <span className="note-card-playlist">{entry.playlistTitle}</span>
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

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>Progress</h1>
        <p className="view-desc">Track your learning journey</p>
      </div>
      <div className="progress-overview">
        <div className="progress-stat-card">
          <CircularProgress percent={totalProgress} size={100} />
          <div>
            <h3>Overall Progress</h3>
            <p>{totalDone} of {totalVideos} videos completed</p>
          </div>
        </div>
        <div className="progress-stat-card stat-mini">
          <div className="stat-number">{playlists.length}</div>
          <p>Total Playlists</p>
        </div>
        <div className="progress-stat-card stat-mini">
          <div className="stat-number">{completedCount}</div>
          <p>Completed</p>
        </div>
        <div className="progress-stat-card stat-mini">
          <div className="stat-number">{countAllNotes()}</div>
          <p>Notes Taken</p>
        </div>
      </div>
      {playlists.length > 0 && (
        <div className="progress-breakdown">
          <h2>Per Playlist</h2>
          {playlists.map((pl) => {
            const prog = getPlaylistProgress(pl);
            return (
              <div key={pl.playlistId} className="progress-row">
                <span className="progress-row-title">{pl.playlistTitle}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${prog.percent}%` }}
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
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/* ─── Shared: CircularProgress ─── */
function CircularProgress({ percent, size = 72 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;
  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
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

  useEffect(() => {
    if (videos.length > 0 && currentIndex >= videos.length) selectVideo(0);
  }, [currentIndex, videos.length]);

  useEffect(() => {
    if (playlistId) {
      const notes = getNotesForPlaylist(playlistId);
      setNoteText(notes[currentIndex] || "");
    }
  }, [currentIndex, playlistId]);

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
      message: `Your question has been noted: "${question}"`,
    });
    setDoubtText("");
  }

  function handleNoteSave() {
    setNoteForVideo(playlistId, currentIndex, noteText);
    setDoubtResponse({ tone: "success", message: "Note saved!" });
    setTimeout(() => setDoubtResponse({ tone: "muted", message: "" }), 2000);
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
                "btn",
                isCurrentComplete ? "btn-ghost" : "btn-secondary",
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
          <p className="section-eyebrow">
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
          <button type="button" className="btn btn-primary" onClick={handleNoteSave}>
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
                className="btn btn-primary"
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
