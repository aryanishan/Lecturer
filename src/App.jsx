import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Home,
  ListVideo,
  Loader2,
  MessageSquare,
  Play,
  Save,
  Send,
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/player" element={<PlayerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HomePage() {
  const [playlistInput, setPlaylistInput] = useState("");
  const [currentPlaylist, setCurrentPlaylistState] = useState(null);
  const [loadedRawInput, setLoadedRawInput] = useState("");
  const [lecturesVisible, setLecturesVisible] = useState(true);
  const [savedPlaylists, setSavedPlaylistsState] = useState(() =>
    getSavedPlaylists(),
  );
  const [status, setStatus] = useState({
    tone: "muted",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const inputMatchesLoaded =
    currentPlaylist && playlistInput.trim() === loadedRawInput;

  useEffect(() => {
    const refreshSavedPlaylists = () => {
      setSavedPlaylistsState(getSavedPlaylists());
    };

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
        message: "Please paste playlist link or ID.",
      });
      return;
    }

    const playlistId = extractPlaylistId(raw);
    if (!playlistId) {
      setStatus({
        tone: "error",
        message: "Invalid playlist link or ID.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ tone: "muted", message: "Loading playlist..." });

    try {
      const [videos, playlistTitle] = await Promise.all([
        fetchPlaylistVideos(playlistId),
        fetchPlaylistTitle(playlistId),
      ]);

      const playlist = {
        playlistId,
        playlistTitle,
        videos,
      };

      setCurrentPlaylist(playlist);
      setCurrentPlaylistState(playlist);
      setLoadedRawInput(raw);
      setLecturesVisible(true);
      setStatus({
        tone: "success",
        message: `Loaded ${videos.length} videos.`,
      });
    } catch (error) {
      console.error(error);
      setCurrentPlaylistState(null);
      setStatus({
        tone: "error",
        message: "Failed to load playlist. Check the playlist ID or API key.",
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
      setStatus({ tone: "error", message: "Load lectures first." });
      return;
    }

    const saved = getSavedPlaylists();
    if (
      saved.some(
        (playlist) => playlist.playlistId === currentPlaylist.playlistId,
      )
    ) {
      setStatus({ tone: "warning", message: "Playlist already saved." });
      return;
    }

    const nextSaved = [...saved, currentPlaylist];
    setSavedPlaylists(nextSaved);
    setSavedPlaylistsState(nextSaved);
    setStatus({ tone: "success", message: "Playlist saved." });
  }

  function openLecture(index) {
    window.open(`/player?index=${index}`, "_blank", "noopener,noreferrer");
  }

  function openSavedPlaylist(playlist) {
    setCurrentPlaylist(playlist);
    window.open("/player?index=0", "_blank", "noopener,noreferrer");
  }

  function deleteSavedPlaylist(index) {
    const nextSaved = savedPlaylists.filter((_, itemIndex) => itemIndex !== index);
    setSavedPlaylists(nextSaved);
    setSavedPlaylistsState(nextSaved);
  }

  const loadButtonText = isLoading
    ? "Loading"
    : inputMatchesLoaded
      ? lecturesVisible
        ? "Hide Lectures"
        : "Show Lectures"
      : "Load Lectures";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur md:px-8">
        <div className="text-sm font-semibold text-sky-300">
          Developed by Aryan
        </div>
      </header>

      <div className="flex h-screen flex-col pt-14 md:flex-row">
        <SavedPlaylists
          playlists={savedPlaylists}
          onOpen={openSavedPlaylist}
          onDelete={deleteSavedPlaylist}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-4 py-6 md:px-8 md:py-8">
          <h1 className="text-center text-2xl font-bold tracking-normal text-zinc-50 md:text-3xl">
            YouTube Playlist Lectures
          </h1>

          <section className="mx-auto mt-6 w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-panel">
            <input
              value={playlistInput}
              onChange={(event) => setPlaylistInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleLoadLectures();
              }}
              placeholder="Paste playlist link or playlist ID..."
              className="h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            />

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleLoadLectures}
                disabled={isLoading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : inputMatchesLoaded && lecturesVisible ? (
                  <ChevronUp className="h-4 w-4" />
                ) : inputMatchesLoaded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ListVideo className="h-4 w-4" />
                )}
                {loadButtonText}
              </button>

              {currentPlaylist ? (
                <>
                  <button
                    type="button"
                    onClick={clearLoadedLectures}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={savePlaylist}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <Save className="h-4 w-4" />
                    Save Playlist
                  </button>
                </>
              ) : null}
            </div>

            {status.message ? <StatusMessage status={status} /> : null}
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

function SavedPlaylists({ playlists, onOpen, onDelete }) {
  return (
    <aside className="app-scrollbar flex max-h-72 w-full flex-col overflow-y-auto border-b border-zinc-800 bg-zinc-900/80 p-4 md:h-full md:max-h-none md:w-72 md:border-b-0 md:border-r">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-sky-300">
        <BookmarkPlus className="h-4 w-4" />
        Saved Playlists
      </div>

      {playlists.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-400">
          No saved playlists yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {playlists.map((playlist, index) => (
            <SavedPlaylistItem
              key={playlist.playlistId}
              playlist={playlist}
              onOpen={() => onOpen(playlist)}
              onDelete={() => onDelete(index)}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

function SavedPlaylistItem({ playlist, onOpen, onDelete }) {
  const progress = getPlaylistProgress(playlist);

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition hover:border-sky-700">
      <div className="truncate text-sm font-semibold text-zinc-100">
        {playlist.playlistTitle}
      </div>

      <ProgressMeter percent={progress.percent} className="mt-3" />
      <div className="mt-2 text-center text-xs text-zinc-400">
        {progress.percent === 100
          ? "Completed"
          : `${progress.percent}% Done`}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          <Play className="h-4 w-4" />
          Watch
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${playlist.playlistTitle}`}
          className="inline-flex h-9 w-10 items-center justify-center rounded-lg bg-rose-600 text-white transition hover:bg-rose-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function LectureResults({ playlist, visible, onOpen }) {
  if (!playlist || !visible) return null;

  return (
    <section className="app-scrollbar mx-auto mt-6 w-full max-w-5xl flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
      {playlist.videos.map((video, index) => (
        <button
          key={`${video.videoId}-${index}`}
          type="button"
          onClick={() => onOpen(index)}
          className="flex min-h-12 w-full items-center gap-3 border-b border-zinc-800 px-4 py-3 text-left transition last:border-b-0 hover:bg-zinc-800/80"
        >
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-100">
            {index + 1}. {video.title}
          </span>
          <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-sky-600 text-white">
            <Play className="h-4 w-4" />
          </span>
        </button>
      ))}
    </section>
  );
}

function StatusMessage({ status }) {
  return (
    <p
      className={cx(
        "mt-3 text-center text-sm",
        status.tone === "error" && "text-rose-300",
        status.tone === "success" && "text-emerald-300",
        status.tone === "warning" && "text-amber-300",
        status.tone === "muted" && "text-zinc-300",
      )}
    >
      {status.message}
    </p>
  );
}

function PlayerPage() {
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
    if (videos.length > 0 && currentIndex >= videos.length) {
      selectVideo(0);
    }
  }, [currentIndex, videos.length]);

  if (!playlistData) {
    return <EmptyPlayerState onBack={() => navigate("/")} />;
  }

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
      setDoubtResponse({
        tone: "error",
        message: "Please type something.",
      });
      return;
    }

    setDoubtResponse({
      tone: "success",
      message: `Bot: "${question}" received. Real AI needs backend.`,
    });
    setDoubtText("");
  }

  function closePlayer() {
    window.close();
    window.setTimeout(() => navigate("/"), 150);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 md:grid md:grid-cols-[minmax(16rem,28%)_1fr]">
      <aside className="app-scrollbar flex max-h-72 flex-col overflow-y-auto border-b border-zinc-800 bg-zinc-950 md:max-h-screen md:border-b-0 md:border-r">
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-4 text-sm font-semibold text-zinc-100">
          Playlist
        </div>

        <div>
          {videos.map((video, index) => {
            const isActive = index === currentIndex;
            const isDone = completed.includes(index);

            return (
              <button
                key={`${video.videoId}-${index}`}
                type="button"
                onClick={() => selectVideo(index)}
                className={cx(
                  "flex min-h-12 w-full items-center gap-3 border-b border-zinc-900 px-4 py-3 text-left text-sm transition",
                  isActive
                    ? "bg-sky-600 text-white"
                    : "text-zinc-200 hover:bg-zinc-900",
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  {index + 1}. {video.title}
                </span>
                <Check
                  className={cx(
                    "h-4 w-4 flex-none text-emerald-300",
                    !isDone && "invisible",
                  )}
                />
              </button>
            );
          })}
        </div>
      </aside>

      <main className="app-scrollbar flex min-h-screen min-w-0 flex-col overflow-y-auto bg-[radial-gradient(circle_at_top,#18181b,#09090b_62%)]">
        <div className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 md:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100 md:text-base">
                {currentVideo?.title || "Loading..."}
              </p>
            </div>

            <div className="flex flex-none items-center gap-2">
              <button
                type="button"
                onClick={toggleComplete}
                className={cx(
                  "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
                  isCurrentComplete
                    ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-500",
                )}
              >
                <Check className="h-4 w-4" />
                {isCurrentComplete ? "Mark Uncomplete" : "Mark Complete"}
              </button>

              <button
                type="button"
                onClick={closePlayer}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 transition hover:bg-zinc-700"
                aria-label="Close player"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-4 pb-3 md:px-5">
            <ProgressMeter percent={progressPercent} />
            <div className="mt-2 text-center text-xs text-zinc-400">
              {progressPercent === 100
                ? "Completed"
                : `${progressPercent}% Done`}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6">
          <div className="aspect-video overflow-hidden rounded-lg bg-black shadow-panel">
            {currentVideo ? (
              <iframe
                title={currentVideo.title}
                src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : null}
          </div>
        </div>

        <section className="mx-auto mb-6 w-full max-w-6xl px-4 md:px-6">
          <button
            type="button"
            onClick={() => setIsDoubtOpen((open) => !open)}
            className="mx-auto flex min-h-10 items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
          >
            <MessageSquare className="h-4 w-4" />
            {isDoubtOpen ? "Hide Doubt Section" : "Show Doubt Section"}
            {isDoubtOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isDoubtOpen ? (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="text-base font-semibold text-zinc-100">
                Ask Your Doubt
              </h2>
              <textarea
                value={doubtText}
                onChange={(event) => setDoubtText(event.target.value)}
                placeholder="Type your question here..."
                className="mt-3 h-24 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
              <button
                type="button"
                onClick={handleDoubtSubmit}
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                <Send className="h-4 w-4" />
                Ask
              </button>

              {doubtResponse.message ? (
                <p
                  className={cx(
                    "mt-3 text-sm",
                    doubtResponse.tone === "error" && "text-rose-300",
                    doubtResponse.tone === "success" && "text-emerald-300",
                  )}
                >
                  {doubtResponse.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function EmptyPlayerState({ onBack }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
        <Home className="mx-auto h-9 w-9 text-sky-300" />
        <h1 className="mt-4 text-xl font-bold">No playlist loaded</h1>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Playlists
        </button>
      </div>
    </div>
  );
}

function ProgressMeter({ percent, className = "" }) {
  return (
    <div
      className={cx(
        "h-2 w-full overflow-hidden rounded-full bg-zinc-800",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default App;
