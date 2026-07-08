const CURRENT_PLAYLIST_KEY = "ytPlaylistData";
const SAVED_PLAYLISTS_KEY = "savedPlaylists";
const COMPLETED_VIDEOS_KEY = "completedVideos";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizePlaylist(data) {
  if (!data || typeof data !== "object") return null;
  if (!data.playlistId || !Array.isArray(data.videos)) return null;

  return {
    playlistId: String(data.playlistId),
    playlistTitle: data.playlistTitle || `Playlist - ${data.playlistId}`,
    videos: data.videos
      .map((video) => ({
        title: video?.title || "Untitled lecture",
        videoId: video?.videoId,
      }))
      .filter((video) => Boolean(video.videoId)),
  };
}

export function getCurrentPlaylist() {
  return normalizePlaylist(readJson(CURRENT_PLAYLIST_KEY, null));
}

export function setCurrentPlaylist(playlist) {
  writeJson(CURRENT_PLAYLIST_KEY, playlist);
}

export function getSavedPlaylists() {
  const saved = readJson(SAVED_PLAYLISTS_KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved.map(normalizePlaylist).filter(Boolean);
}

export function setSavedPlaylists(playlists) {
  writeJson(SAVED_PLAYLISTS_KEY, playlists);
}

export function getCompletedDataSafe() {
  const parsed = readJson(COMPLETED_VIDEOS_KEY, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([playlistId, values]) => [
      playlistId,
      Array.isArray(values)
        ? [...new Set(values.filter((value) => Number.isInteger(value)))]
        : [],
    ]),
  );
}

export function setCompletedForPlaylist(playlistId, completedIndices) {
  const completedData = getCompletedDataSafe();
  completedData[playlistId] = [
    ...new Set(completedIndices.filter((value) => Number.isInteger(value))),
  ].sort((a, b) => a - b);
  writeJson(COMPLETED_VIDEOS_KEY, completedData);
  return completedData;
}

export function getPlaylistProgress(playlist) {
  const completed = getCompletedDataSafe()[playlist.playlistId] || [];
  const total = playlist.videos.length;
  const done = completed.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { done, total, percent };
}
