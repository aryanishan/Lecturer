import { getAuthToken, saveAccountData } from "../services/api";

const CURRENT_PLAYLIST_KEY = "ytPlaylistData";
const SAVED_PLAYLISTS_KEY = "savedPlaylists";
const COMPLETED_VIDEOS_KEY = "completedVideos";
const FAVORITES_KEY = "studyshelf-favorites";
const NOTES_KEY = "studyshelf-notes";

function canUseStorage() { return typeof window !== "undefined" && Boolean(window.localStorage); }
function readJson(key, fallback) { try { const raw = canUseStorage() && window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function writeJson(key, value) { if (canUseStorage()) window.localStorage.setItem(key, JSON.stringify(value)); }
function normalizePlaylist(data) {
  if (!data || typeof data !== "object" || !data.playlistId || !Array.isArray(data.videos)) return null;
  return { playlistId: String(data.playlistId), playlistTitle: data.playlistTitle || `Playlist - ${data.playlistId}`, videos: data.videos.map((video) => ({ title: video?.title || "Untitled lecture", videoId: video?.videoId })).filter((video) => Boolean(video.videoId)), addedAt: data.addedAt || Date.now() };
}
let saveQueue = Promise.resolve();
function syncAccountData() {
  if (!getAuthToken()) return;
  saveQueue = saveQueue.catch(() => {}).then(() => saveAccountData(getLocalData()));
}

export function getCurrentPlaylist() { return normalizePlaylist(readJson(CURRENT_PLAYLIST_KEY, null)); }
export function setCurrentPlaylist(playlist) { writeJson(CURRENT_PLAYLIST_KEY, playlist); syncAccountData(); }
export function getSavedPlaylists() { const saved = readJson(SAVED_PLAYLISTS_KEY, []); return Array.isArray(saved) ? saved.map(normalizePlaylist).filter(Boolean) : []; }
export function setSavedPlaylists(playlists) { writeJson(SAVED_PLAYLISTS_KEY, playlists); syncAccountData(); }
export function getCompletedDataSafe() {
  const parsed = readJson(COMPLETED_VIDEOS_KEY, {});
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

/* ─── Data sync ─── */
export function getLocalData() { return { currentPlaylist: getCurrentPlaylist(), savedPlaylists: getSavedPlaylists(), completedVideos: getCompletedDataSafe(), favorites: getFavorites(), notes: getAllNotes() }; }
export function hasLocalData(data) { return Boolean(data?.currentPlaylist || data?.savedPlaylists?.length || Object.keys(data?.completedVideos || {}).length); }
export function hydrateLocalData(data) {
  writeJson(CURRENT_PLAYLIST_KEY, data?.currentPlaylist || null);
  writeJson(SAVED_PLAYLISTS_KEY, data?.savedPlaylists || []);
  writeJson(COMPLETED_VIDEOS_KEY, data?.completedVideos || {});
  if (data?.favorites) writeJson(FAVORITES_KEY, data.favorites);
  if (data?.notes) writeJson(NOTES_KEY, data.notes);
}
