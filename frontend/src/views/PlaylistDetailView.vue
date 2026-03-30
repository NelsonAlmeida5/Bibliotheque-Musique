<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";

const route = useRoute();
const router = useRouter();

const playlistId = computed(() => Number(route.params.id));

const isLoading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const isAddingTrack = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const playlist = ref(null);
const playlistName = ref("");
const playlistDescription = ref("");

const availableTracks = ref([]);
const addTracksSearch = ref("");
const showAddTracksPanel = ref(false);

/* -------------------- YouTube player state -------------------- */
const activePlayerTrackId = ref(null);
const playerInstances = new Map();
const playerCreationPromises = new Map();
const playerStates = reactive({});

function clearFeedback() {
  errorMessage.value = "";
  successMessage.value = "";
}

function extractCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    fallbackMessage
  );
}

function normalizeTrack(item, source = "public") {
  return {
    id: item.id,
    title: item.title ?? "Untitled track",
    artist:
      item.artist?.name ??
      item.customArtistName ??
      item.custom_artist_name ??
      "Unknown artist",
    category:
      item.category?.name ??
      item.customCategoryName ??
      item.custom_category_name ??
      "Uncategorized",
    coverUrl: item.coverUrl ?? item.cover_url ?? "",
    embedUrl: item.embedUrl ?? item.embed_url ?? "",
    createdAt: item.createdAt ?? item.created_at ?? null,
    source,
  };
}

function normalizePlaylist(item) {
  return {
    id: item.id,
    name: item.name ?? "Untitled playlist",
    description: item.description ?? "",
    updatedAt:
      item.updatedAt ??
      item.updated_at ??
      item.createdAt ??
      item.created_at ??
      null,
    tracks: Array.isArray(item.tracks)
      ? item.tracks.map((track) =>
          normalizeTrack(
            track,
            (track.isPublic ?? track.is_public) ? "public" : "private",
          ),
        )
      : [],
  };
}

function getCoverStyle(url) {
  if (!url) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${url}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function formatUpdatedLabel(dateValue) {
  if (!dateValue) return "Recently updated";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const trackCount = computed(() => playlist.value?.tracks?.length ?? 0);

const currentTrackIds = computed(
  () =>
    new Set((playlist.value?.tracks ?? []).map((track) => Number(track.id))),
);

const filteredAvailableTracks = computed(() => {
  const search = normalize(addTracksSearch.value);

  return availableTracks.value
    .filter((track) => !currentTrackIds.value.has(Number(track.id)))
    .filter((track) => {
      if (!search) return true;

      return (
        normalize(track.title).includes(search) ||
        normalize(track.artist).includes(search) ||
        normalize(track.category).includes(search) ||
        normalize(track.source).includes(search)
      );
    })
    .sort((a, b) => a.title.localeCompare(b.title));
});

/* -------------------- YouTube helpers -------------------- */
function extractYouTubeVideoId(rawUrl) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return pathParts[0] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      if (pathParts[0] === "embed" && pathParts[1]) {
        return pathParts[1];
      }

      if (pathParts[0] === "shorts" && pathParts[1]) {
        return pathParts[1];
      }

      if (pathParts[0] === "live" && pathParts[1]) {
        return pathParts[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getPlayerKey(trackId) {
  return String(trackId);
}

function getPlayerHostId(trackId) {
  return `playlist-track-player-${trackId}`;
}

function ensurePlayerState(trackId) {
  const key = getPlayerKey(trackId);

  if (!playerStates[key]) {
    playerStates[key] = {
      ready: false,
      phase: "idle",
      label: "Closed",
      error: "",
    };
  }

  return playerStates[key];
}

function getTrackPlayerState(trackId) {
  return (
    playerStates[getPlayerKey(trackId)] || {
      ready: false,
      phase: "idle",
      label: "Closed",
      error: "",
    }
  );
}

function getYouTubeErrorMessage(code) {
  switch (code) {
    case 2:
      return "Invalid YouTube video URL or video ID.";
    case 5:
      return "The YouTube HTML5 player could not load this video.";
    case 100:
      return "This YouTube video was not found or is private.";
    case 101:
    case 150:
      return "This YouTube video does not allow embedded playback.";
    default:
      return "Unable to load the YouTube player for this track.";
  }
}

function handlePlayerStateChange(trackId, stateCode) {
  const state = ensurePlayerState(trackId);
  const ytStates = window.YT?.PlayerState;

  if (!ytStates) return;

  switch (stateCode) {
    case ytStates.UNSTARTED:
      state.phase = "ready";
      state.label = "Ready";
      break;
    case ytStates.ENDED:
      state.phase = "ended";
      state.label = "Ended";
      break;
    case ytStates.PLAYING:
      state.phase = "playing";
      state.label = "Playing";
      pauseOtherPlayers(trackId);
      break;
    case ytStates.PAUSED:
      state.phase = "paused";
      state.label = "Paused";
      break;
    case ytStates.BUFFERING:
      state.phase = "buffering";
      state.label = "Buffering...";
      break;
    case ytStates.CUED:
      state.phase = "cued";
      state.label = "Cued";
      break;
    default:
      state.phase = "idle";
      state.label = "Idle";
  }
}

function pauseOtherPlayers(activeTrackId) {
  const activeKey = getPlayerKey(activeTrackId);

  for (const [key, player] of playerInstances.entries()) {
    if (key === activeKey) continue;

    if (player && typeof player.pauseVideo === "function") {
      try {
        player.pauseVideo();
      } catch {}
    }
  }
}

function destroyPlayer(trackId, { preserveState = false } = {}) {
  const key = getPlayerKey(trackId);
  const player = playerInstances.get(key);

  if (player && typeof player.destroy === "function") {
    try {
      player.destroy();
    } catch {}
  }

  playerInstances.delete(key);
  playerCreationPromises.delete(key);

  if (!preserveState && playerStates[key]) {
    delete playerStates[key];
  }
}

function resetAllPlayers() {
  for (const key of playerInstances.keys()) {
    destroyPlayer(key);
  }

  for (const key of Object.keys(playerStates)) {
    delete playerStates[key];
  }

  activePlayerTrackId.value = null;
}

function loadYouTubeIframeApi() {
  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }

  if (window.__nightwaveYoutubeIframeApiPromise) {
    return window.__nightwaveYoutubeIframeApiPromise;
  }

  window.__nightwaveYoutubeIframeApiPromise = new Promise((resolve, reject) => {
    let settled = false;

    const finishResolve = () => {
      if (settled) return;
      settled = true;
      resolve(window.YT);
    };

    const finishReject = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") {
        previousReady();
      }

      finishResolve();
    };

    if (window.YT && typeof window.YT.Player === "function") {
      finishResolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-youtube-iframe-api="true"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.youtubeIframeApi = "true";
      script.onerror = () =>
        finishReject(
          new Error("Unable to load the YouTube IFrame Player API."),
        );

      document.head.appendChild(script);
    }

    window.setTimeout(() => {
      if (!window.YT || typeof window.YT.Player !== "function") {
        finishReject(new Error("YouTube IFrame Player API loading timed out."));
      }
    }, 12000);
  });

  return window.__nightwaveYoutubeIframeApiPromise;
}

async function ensurePlayer(track) {
  const key = getPlayerKey(track.id);
  const state = ensurePlayerState(track.id);

  if (playerInstances.has(key)) {
    return playerInstances.get(key);
  }

  if (playerCreationPromises.has(key)) {
    return playerCreationPromises.get(key);
  }

  const videoId = extractYouTubeVideoId(track.embedUrl);

  if (!videoId) {
    state.ready = false;
    state.phase = "unsupported";
    state.label = "Unsupported URL";
    state.error =
      "This premium preview currently works with YouTube URLs only.";
    return null;
  }

  state.ready = false;
  state.phase = "loading";
  state.label = "Loading player...";
  state.error = "";

  const creationPromise = (async () => {
    try {
      const YT = await loadYouTubeIframeApi();
      await nextTick();

      const hostId = getPlayerHostId(track.id);
      const hostElement = document.getElementById(hostId);

      if (!hostElement) {
        throw new Error("Player container not found.");
      }

      return await new Promise((resolve, reject) => {
        const player = new YT.Player(hostId, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            controls: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              playerInstances.set(key, event.target);
              state.ready = true;
              state.phase = "ready";
              state.label = "Ready";
              resolve(event.target);
            },
            onStateChange: (event) => {
              handlePlayerStateChange(track.id, event.data);
            },
            onError: (event) => {
              state.ready = false;
              state.phase = "error";
              state.label = "Player error";
              state.error = getYouTubeErrorMessage(event.data);
              reject(new Error(state.error));
            },
          },
        });

        playerInstances.set(key, player);
      });
    } catch (error) {
      state.ready = false;
      state.phase = "error";
      state.label = "Player error";
      state.error = error?.message || "Unable to create the YouTube player.";
      destroyPlayer(track.id, { preserveState: true });
      return null;
    } finally {
      playerCreationPromises.delete(key);
    }
  })();

  playerCreationPromises.set(key, creationPromise);
  return creationPromise;
}

async function togglePlayerPanel(track) {
  clearFeedback();

  if (activePlayerTrackId.value === track.id) {
    closePlayer(track.id);
    return;
  }

  if (activePlayerTrackId.value !== null) {
    closePlayer(activePlayerTrackId.value);
  }

  activePlayerTrackId.value = track.id;
  ensurePlayerState(track.id);

  await ensurePlayer(track);
}

function closePlayer(trackId) {
  const state = ensurePlayerState(trackId);

  destroyPlayer(trackId, { preserveState: true });

  if (state.phase !== "error" && state.phase !== "unsupported") {
    state.ready = false;
    state.phase = "idle";
    state.label = "Closed";
    state.error = "";
  }

  if (activePlayerTrackId.value === trackId) {
    activePlayerTrackId.value = null;
  }
}

async function togglePlayPause(track) {
  clearFeedback();

  if (activePlayerTrackId.value !== track.id) {
    await togglePlayerPanel(track);
  }

  const player = await ensurePlayer(track);
  const state = ensurePlayerState(track.id);

  if (!player) return;

  if (state.phase === "playing") {
    player.pauseVideo();
  } else {
    pauseOtherPlayers(track.id);
    player.playVideo();
  }
}

function stopPlayback(trackId) {
  const player = playerInstances.get(getPlayerKey(trackId));

  if (!player || typeof player.stopVideo !== "function") return;

  player.stopVideo();
}

function isPlayerOpen(trackId) {
  return activePlayerTrackId.value === trackId;
}

/* -------------------- Page data -------------------- */
async function loadPlaylist() {
  const response = await api.get(`/my-playlists/${playlistId.value}`);
  playlist.value = normalizePlaylist(response.data);
  playlistName.value = playlist.value.name;
  playlistDescription.value = playlist.value.description;
}

async function loadAvailableTracks() {
  const [publicTracksResponse, privateTracksResponse] = await Promise.all([
    api.get("/tracks", { params: { page: 1, limit: 100 } }),
    api.get("/my-tracks"),
  ]);

  const publicTracks = extractCollection(publicTracksResponse.data).map(
    (track) => normalizeTrack(track, "public"),
  );

  const privateTracks = extractCollection(privateTracksResponse.data).map(
    (track) => normalizeTrack(track, "private"),
  );

  const merged = [...publicTracks, ...privateTracks];
  const deduped = [];
  const seen = new Set();

  for (const track of merged) {
    const id = Number(track.id);
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(track);
  }

  availableTracks.value = deduped;
}

async function loadPage() {
  isLoading.value = true;
  clearFeedback();

  try {
    await Promise.all([loadPlaylist(), loadAvailableTracks()]);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to load this playlist right now.",
    );
    playlist.value = null;
  } finally {
    isLoading.value = false;
  }
}

function goBack() {
  router.push({ name: "my-playlists" });
}

async function saveChanges() {
  clearFeedback();

  if (!playlistName.value.trim()) {
    errorMessage.value = "Playlist name is required.";
    return;
  }

  isSaving.value = true;

  try {
    const response = await api.put(`/my-playlists/${playlistId.value}`, {
      name: playlistName.value.trim(),
      description: playlistDescription.value.trim() || null,
    });

    if (playlist.value) {
      playlist.value.name = response.data?.name ?? playlistName.value.trim();
      playlist.value.description =
        response.data?.description ?? playlistDescription.value.trim();
      playlist.value.updatedAt =
        response.data?.updatedAt ??
        response.data?.updated_at ??
        playlist.value.updatedAt;
    }

    successMessage.value = "Playlist updated successfully.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to save playlist changes.",
    );
  } finally {
    isSaving.value = false;
  }
}

async function removeTrack(trackId) {
  clearFeedback();

  try {
    closePlayer(trackId);

    await api.delete(`/my-playlists/${playlistId.value}/tracks/${trackId}`);

    if (playlist.value) {
      playlist.value.tracks = playlist.value.tracks.filter(
        (track) => Number(track.id) !== Number(trackId),
      );
    }

    successMessage.value = "Track removed from playlist.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to remove this track from the playlist.",
    );
  }
}

async function addTrack(track) {
  clearFeedback();
  isAddingTrack.value = true;

  try {
    await api.post(`/my-playlists/${playlistId.value}/tracks`, {
      track_id: track.id,
    });

    await loadPlaylist();
    successMessage.value = "Track added to playlist successfully.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to add this track to the playlist.",
    );
  } finally {
    isAddingTrack.value = false;
  }
}

async function deletePlaylist() {
  clearFeedback();

  const confirmed = window.confirm(
    `Delete "${playlistName.value}" permanently?`,
  );

  if (!confirmed) return;

  isDeleting.value = true;

  try {
    await api.delete(`/my-playlists/${playlistId.value}`);
    router.push({ name: "my-playlists" });
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to delete this playlist.",
    );
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadPage();
});

watch(
  () => route.params.id,
  () => {
    resetAllPlayers();
    loadPage();
  },
);

onBeforeUnmount(() => {
  resetAllPlayers();
});
</script>

<template>
  <section class="playlist-detail-page">
    <div class="container">
      <button type="button" class="playlist-back-link" @click="goBack">
        ← Back to My Playlists
      </button>

      <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

      <div v-if="isLoading" class="playlist-detail-panel">
        <p class="playlist-empty-state">Loading playlist...</p>
      </div>

      <template v-else-if="playlist">
        <section class="playlist-detail-hero">
          <div class="playlist-detail-hero__left">
            <h1>Customize playlist</h1>

            <p class="playlist-detail-current-name">
              Editing: <span>{{ playlistName }}</span>
            </p>

            <p class="playlist-detail-subtitle">
              Update the playlist information and manage its tracks.
            </p>

            <div class="playlist-detail-stats">
              <span>{{ trackCount }} tracks</span>
              <span>Updated {{ formatUpdatedLabel(playlist.updatedAt) }}</span>
            </div>
          </div>

          <div class="playlist-detail-hero__right">
            <button
              type="button"
              class="button button--primary"
              :disabled="isSaving"
              @click="saveChanges"
            >
              {{ isSaving ? "Saving..." : "Save changes" }}
            </button>
          </div>
        </section>

        <div class="playlist-detail-layout">
          <section class="playlist-detail-panel playlist-detail-panel--info">
            <h2>Playlist info</h2>

            <div class="playlist-form">
              <div class="playlist-form__field">
                <label for="playlist-name">Name</label>
                <input
                  id="playlist-name"
                  v-model="playlistName"
                  type="text"
                  placeholder="Playlist name"
                />
              </div>

              <div class="playlist-form__field">
                <label for="playlist-description">Description</label>
                <textarea
                  id="playlist-description"
                  v-model="playlistDescription"
                  rows="5"
                  placeholder="Describe this playlist"
                ></textarea>
              </div>
            </div>
          </section>

          <section class="playlist-detail-panel playlist-detail-panel--tracks">
            <div class="playlist-detail-panel__header">
              <div class="playlist-detail-panel__title-group">
                <h2>Tracks in this playlist</h2>
                <span>{{ trackCount }} total</span>
              </div>

              <button
                type="button"
                class="button button--secondary button--sm"
                @click="showAddTracksPanel = !showAddTracksPanel"
              >
                {{ showAddTracksPanel ? "Hide add tracks" : "Add tracks" }}
              </button>
            </div>

            <div v-if="showAddTracksPanel" class="playlist-add-panel">
              <div class="playlist-add-panel__header">
                <div>
                  <h3>Add tracks</h3>
                  <p>
                    You can add public catalog tracks and your own private
                    tracks.
                  </p>
                </div>
              </div>

              <input
                v-model="addTracksSearch"
                type="text"
                class="playlist-add-panel__search"
                placeholder="Search tracks to add..."
              />

              <div
                v-if="filteredAvailableTracks.length"
                class="playlist-add-list"
              >
                <article
                  v-for="track in filteredAvailableTracks"
                  :key="track.id"
                  class="playlist-add-row"
                >
                  <div
                    class="playlist-add-row__cover"
                    :style="getCoverStyle(track.coverUrl)"
                  ></div>

                  <div class="playlist-add-row__main">
                    <h3>{{ track.title }}</h3>
                    <p>{{ track.artist }} · {{ track.category }}</p>
                  </div>

                  <div class="playlist-add-row__meta">
                    <span class="playlist-source-badge">
                      {{ track.source === "private" ? "Private" : "Public" }}
                    </span>
                  </div>

                  <button
                    type="button"
                    class="button button--details button--sm"
                    :disabled="isAddingTrack"
                    @click="addTrack(track)"
                  >
                    Add
                  </button>
                </article>
              </div>

              <div v-else class="playlist-empty-state">
                <p>No available tracks match your search.</p>
              </div>
            </div>

            <div v-if="playlist.tracks.length" class="playlist-track-list">
              <article
                v-for="track in playlist.tracks"
                :key="track.id"
                class="playlist-track-card"
              >
                <div class="playlist-track-row">
                  <div
                    class="playlist-track-row__cover"
                    :style="getCoverStyle(track.coverUrl)"
                  ></div>

                  <div class="playlist-track-row__main">
                    <h3>{{ track.title }}</h3>
                    <p>{{ track.artist }}</p>
                  </div>

                  <div class="playlist-track-row__category">
                    {{ track.category }}
                  </div>

                  <div class="playlist-track-row__actions">
                    <RouterLink
                      v-if="track.source === 'public'"
                      :to="{ name: 'track-detail', params: { id: track.id } }"
                      class="button button--details button--sm"
                    >
                      Details
                    </RouterLink>

                    <RouterLink
                      v-else
                      :to="{
                        path: '/my-tracks',
                        query: { highlight: String(track.id) },
                      }"
                      class="button button--details button--sm"
                    >
                      My Tracks
                    </RouterLink>

                    <button
                      type="button"
                      class="button button--secondary button--sm"
                      @click="togglePlayerPanel(track)"
                    >
                      {{
                        isPlayerOpen(track.id) ? "Hide player" : "Media player"
                      }}
                    </button>

                    <button
                      type="button"
                      class="button button--ghost button--sm"
                      @click="removeTrack(track.id)"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div
                  v-if="isPlayerOpen(track.id)"
                  class="playlist-track-player-panel"
                >
                  <div class="playlist-track-player-panel__top">
                    <div>
                      <h4>YouTube player</h4>
                      <p>{{ getTrackPlayerState(track.id).label }}</p>
                    </div>

                    <div class="playlist-track-player-toolbar">
                      <button
                        type="button"
                        class="button button--details button--sm"
                        @click="togglePlayPause(track)"
                      >
                        {{
                          getTrackPlayerState(track.id).phase === "playing"
                            ? "Pause"
                            : "Play"
                        }}
                      </button>

                      <button
                        type="button"
                        class="button button--ghost button--sm"
                        @click="stopPlayback(track.id)"
                      >
                        Stop
                      </button>
                    </div>
                  </div>

                  <p
                    v-if="getTrackPlayerState(track.id).error"
                    class="playlist-track-player-error"
                  >
                    {{ getTrackPlayerState(track.id).error }}
                  </p>

                  <div
                    v-else
                    class="playlist-track-player-host"
                    :id="getPlayerHostId(track.id)"
                  ></div>
                </div>
              </article>
            </div>

            <div v-else class="playlist-empty-state">
              <p>This playlist is empty.</p>
            </div>
          </section>
        </div>

        <section class="playlist-delete-panel">
          <div>
            <h2>Delete playlist</h2>
            <p>This action is permanent and cannot be undone.</p>
          </div>

          <button
            type="button"
            class="button button--danger"
            :disabled="isDeleting"
            @click="deletePlaylist"
          >
            {{ isDeleting ? "Deleting..." : "Delete playlist" }}
          </button>
        </section>
      </template>
    </div>
  </section>
</template>
