const API_KEY =
  import.meta.env.VITE_YOUTUBE_API_KEY ||
  "AIzaSyDvCqcPf09hiBeXscXkFLTpe86HPvttVFo";

export function extractPlaylistId(input) {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const id = url.searchParams.get("list");
    if (id) return id;
  } catch {
    if (raw.includes("list=")) {
      return raw.split("list=")[1]?.split("&")[0] || null;
    }
  }

  return raw.length > 10 ? raw : null;
}

export function extractVideoId(input) {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
    if (host.endsWith("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch {
    // A bare YouTube video id is also a convenient input format.
  }

  return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : null;
}

async function requestJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "YouTube API request failed");
  }

  return data;
}

export async function fetchPlaylistVideos(playlistId) {
  const videos = [];
  let nextPageToken = "";

  do {
    const params = new URLSearchParams({
      part: "snippet",
      maxResults: "50",
      playlistId,
      key: API_KEY,
    });

    if (nextPageToken) params.set("pageToken", nextPageToken);

    const data = await requestJson(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
    );

    if (!Array.isArray(data.items)) {
      throw new Error("Invalid playlist response");
    }

    videos.push(
      ...data.items
        .map((item) => ({
          title: item.snippet?.title || "Untitled lecture",
          videoId: item.snippet?.resourceId?.videoId,
        }))
        .filter((video) => Boolean(video.videoId)),
    );

    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);

  return videos;
}

export async function fetchPlaylistTitle(playlistId) {
  const params = new URLSearchParams({
    part: "snippet",
    id: playlistId,
    key: API_KEY,
  });

  try {
    const data = await requestJson(
      `https://www.googleapis.com/youtube/v3/playlists?${params}`,
    );
    return data.items?.[0]?.snippet?.title || `Playlist - ${playlistId}`;
  } catch {
    return `Playlist - ${playlistId}`;
  }
}

export async function fetchVideoDetails(videoId) {
  const params = new URLSearchParams({
    part: "snippet",
    id: videoId,
    key: API_KEY,
  });
  const data = await requestJson(
    `https://www.googleapis.com/youtube/v3/videos?${params}`,
  );
  const snippet = data.items?.[0]?.snippet;
  if (!snippet) throw new Error("Video was not found");
  return {
    title: snippet.title || "Untitled video",
    channelTitle: snippet.channelTitle || "YouTube Creator",
  };
}
