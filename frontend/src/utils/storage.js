import { getAuthToken, saveAccountData } from "../services/api";

const CURRENT_PLAYLIST_KEY = "ytPlaylistData";
const SAVED_PLAYLISTS_KEY = "savedPlaylists";
const COMPLETED_VIDEOS_KEY = "completedVideos";
const FAVORITES_KEY = "studyshelf-favorites";
const NOTES_KEY = "studyshelf-notes";
const VIDEO_PROGRESS_KEY = "studyshelf-video-progress";
const LEARNING_LADDER_KEY = "studyshelf-learning-ladder";

function canUseStorage() { return typeof window !== "undefined" && Boolean(window.localStorage); }
function readJson(key, fallback) { try { const raw = canUseStorage() && window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function writeJson(key, value) { if (canUseStorage()) window.localStorage.setItem(key, JSON.stringify(value)); }
function normalizePlaylist(data) {
  if (!data || typeof data !== "object" || !data.playlistId || !Array.isArray(data.videos)) return null;
  return {
    playlistId: String(data.playlistId),
    playlistTitle: data.playlistTitle || `Playlist - ${data.playlistId}`,
    channelTitle: data.channelTitle || "YouTube Creator",
    code: data.code || null,
    sourceType: data.sourceType === "video" ? "video" : "playlist",
    videos: data.videos.map((video) => ({ title: video?.title || "Untitled lecture", videoId: video?.videoId })).filter((video) => Boolean(video.videoId)),
    addedAt: data.addedAt || Date.now()
  };
}
let saveQueue = Promise.resolve();
function syncAccountData() {
  if (!getAuthToken()) return;
  saveQueue = saveQueue.catch(() => {}).then(() => saveAccountData(getLocalData()));
}

export function getCurrentPlaylist() { return normalizePlaylist(readJson(CURRENT_PLAYLIST_KEY, null)); }
export function setCurrentPlaylist(playlist) { writeJson(CURRENT_PLAYLIST_KEY, playlist); syncAccountData(); }
export function getSavedPlaylists() {
  const saved = readJson(SAVED_PLAYLISTS_KEY, null);
  if (saved === null) return [];
  return Array.isArray(saved) ? saved.map(normalizePlaylist).filter(Boolean) : [];
}
export function setSavedPlaylists(playlists) { writeJson(SAVED_PLAYLISTS_KEY, playlists); syncAccountData(); }
export function getCompletedDataSafe() {
  const parsed = readJson(COMPLETED_VIDEOS_KEY, null);
  if (parsed === null) return {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return Object.fromEntries(Object.entries(parsed).map(([playlistId, values]) => [playlistId, Array.isArray(values) ? [...new Set(values.filter((value) => Number.isInteger(value)))] : []]));
}
export function setCompletedForPlaylist(playlistId, completedIndices) {
  const completedData = getCompletedDataSafe();
  completedData[playlistId] = [...new Set(completedIndices.filter((value) => Number.isInteger(value)))].sort((a, b) => a - b);
  writeJson(COMPLETED_VIDEOS_KEY, completedData); syncAccountData(); return completedData;
}
export function getPlaylistProgress(playlist) { const completed = getCompletedDataSafe()[playlist.playlistId] || []; const total = playlist.videos.length; const done = completed.length; return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) }; }

/* ─── Favorites ─── */
export function getFavorites() { return readJson(FAVORITES_KEY, []); }
export function setFavorites(favorites) { writeJson(FAVORITES_KEY, favorites); syncAccountData(); }
export function toggleFavorite(playlistId) {
  const favs = getFavorites();
  const index = favs.indexOf(playlistId);
  if (index >= 0) favs.splice(index, 1); else favs.push(playlistId);
  setFavorites(favs);
  return favs;
}
export function isFavorite(playlistId) { return getFavorites().includes(playlistId); }

/* ─── Learning ladder ─── */
export function getLearningLadder() {
  const ladder = readJson(LEARNING_LADDER_KEY, []);
  return Array.isArray(ladder)
    ? [...new Set(ladder.filter((playlistId) => typeof playlistId === "string"))]
    : [];
}
export function setLearningLadder(playlistIds) {
  const ladder = Array.isArray(playlistIds)
    ? [...new Set(playlistIds.filter((playlistId) => typeof playlistId === "string"))]
    : [];
  writeJson(LEARNING_LADDER_KEY, ladder);
  syncAccountData();
  return ladder;
}

/* ─── Notes ─── */
export function getAllNotes() { return readJson(NOTES_KEY, {}); }
export function setAllNotes(notes) { writeJson(NOTES_KEY, notes); syncAccountData(); }
export function getNotesForPlaylist(playlistId) { return getAllNotes()[playlistId] || {}; }
export function setNoteForVideo(playlistId, videoIndex, text) {
  const all = getAllNotes();
  if (!all[playlistId]) all[playlistId] = {};
  if (text.trim()) { all[playlistId][videoIndex] = text; } else { delete all[playlistId][videoIndex]; }
  setAllNotes(all);
  return all;
}
export function countAllNotes() {
  const all = getAllNotes();
  return Object.values(all).reduce((sum, playlist) => sum + Object.keys(playlist).length, 0);
}

/* ─── Per-video watch progress ─── */
export function getVideoProgress(videoId) {
  const allProgress = readJson(VIDEO_PROGRESS_KEY, {});
  const progress = allProgress?.[videoId];
  return {
    watchedSeconds: Number.isFinite(progress?.watchedSeconds)
      ? Math.max(0, progress.watchedSeconds)
      : 0,
    duration: Number.isFinite(progress?.duration)
      ? Math.max(0, progress.duration)
      : 0,
  };
}

export function setVideoProgress(videoId, watchedSeconds, duration, { replace = false } = {}) {
  if (!videoId) return { watchedSeconds: 0, duration: 0 };
  const allProgress = readJson(VIDEO_PROGRESS_KEY, {});
  const previous = getVideoProgress(videoId);
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : previous.duration;
  const safeSeconds = Number.isFinite(watchedSeconds) ? Math.max(0, watchedSeconds) : previous.watchedSeconds;
  const next = {
    watchedSeconds: Math.min(replace ? safeSeconds : Math.max(previous.watchedSeconds, safeSeconds), safeDuration || Infinity),
    duration: safeDuration,
  };
  writeJson(VIDEO_PROGRESS_KEY, { ...allProgress, [videoId]: next });
  return next;
}

/* ─── Data sync ─── */
export function getLocalData() { return { currentPlaylist: getCurrentPlaylist(), savedPlaylists: getSavedPlaylists(), completedVideos: getCompletedDataSafe(), favorites: getFavorites(), notes: getAllNotes(), videoProgress: readJson(VIDEO_PROGRESS_KEY, {}), learningLadder: getLearningLadder() }; }
export function hasLocalData(data) { return Boolean(data?.currentPlaylist || data?.savedPlaylists?.length || Object.keys(data?.completedVideos || {}).length); }
export function hydrateLocalData(data) {
  writeJson(CURRENT_PLAYLIST_KEY, data?.currentPlaylist || null);
  writeJson(SAVED_PLAYLISTS_KEY, data?.savedPlaylists || []);
  writeJson(COMPLETED_VIDEOS_KEY, data?.completedVideos || {});
  if (data?.favorites) writeJson(FAVORITES_KEY, data.favorites);
  if (data?.notes) writeJson(NOTES_KEY, data.notes);
  if (data?.videoProgress) writeJson(VIDEO_PROGRESS_KEY, data.videoProgress);
  if (data?.learningLadder) writeJson(LEARNING_LADDER_KEY, data.learningLadder);
}
