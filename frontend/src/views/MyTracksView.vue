<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";
import api from "../services/api";

const artistOptions = ref([]);
const categoryOptions = ref([]);
const tracks = ref([]);

const isInitialLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const activePlayerTrackId = ref(null);

const playerInstances = new Map();
const playerCreationPromises = new Map();
const playerStates = reactive({});

const form = ref({
  id: null,
  title: "",
  embedUrl: "",
  coverUrl: "",
  description: "",
  artistInput: "",
  categoryInput: "",
  selectedArtistId: null,
  selectedCategoryId: null,
});

const showArtistSuggestions = ref(false);
const showCategorySuggestions = ref(false);

const isEditing = computed(() => form.value.id !== null);
const privateTrackCount = computed(() => tracks.value.length);

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function extractCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeOption(item) {
  return {
    id: item.id,
    name: item.name,
  };
}

function normalizeTrack(track) {
  return {
    id: track.id,
    title: track.title ?? "",
    embedUrl: track.embedUrl ?? track.embed_url ?? "",
    coverUrl: track.coverUrl ?? track.cover_url ?? "",
    description: track.description ?? "",
    artistId: track.artistId ?? track.artist_id ?? track.artist?.id ?? null,
    categoryId:
      track.categoryId ?? track.category_id ?? track.category?.id ?? null,
    customArtistName:
      track.customArtistName ?? track.custom_artist_name ?? null,
    customCategoryName:
      track.customCategoryName ?? track.custom_category_name ?? null,
    isPublic: track.isPublic ?? track.is_public ?? false,
    artist: track.artist ?? null,
    category: track.category ?? null,
  };
}

function clearFeedback() {
  errorMessage.value = "";
  successMessage.value = "";
}

function getArtistName(artistId) {
  return (
    artistOptions.value.find((artist) => artist.id === artistId)?.name ||
    "Unknown artist"
  );
}

function getCategoryName(categoryId) {
  return (
    categoryOptions.value.find((category) => category.id === categoryId)
      ?.name || "Unknown category"
  );
}

function getTrackArtistLabel(track) {
  if (track.customArtistName) return track.customArtistName;
  if (track.artist?.name) return track.artist.name;
  if (track.artistId) return getArtistName(track.artistId);
  return "Unspecified artist";
}

function getTrackCategoryLabel(track) {
  if (track.customCategoryName) return track.customCategoryName;
  if (track.category?.name) return track.category.name;
  if (track.categoryId) return getCategoryName(track.categoryId);
  return "Unspecified category";
}

const filteredArtistOptions = computed(() => {
  const search = normalize(form.value.artistInput);
  if (!search) return artistOptions.value;

  return artistOptions.value.filter((artist) =>
    normalize(artist.name).includes(search),
  );
});

const filteredCategoryOptions = computed(() => {
  const search = normalize(form.value.categoryInput);
  if (!search) return categoryOptions.value;

  return categoryOptions.value.filter((category) =>
    normalize(category.name).includes(search),
  );
});

function findExactArtistMatch(input) {
  return (
    artistOptions.value.find(
      (artist) => normalize(artist.name) === normalize(input),
    ) || null
  );
}

function findExactCategoryMatch(input) {
  return (
    categoryOptions.value.find(
      (category) => normalize(category.name) === normalize(input),
    ) || null
  );
}

function handleArtistInput() {
  const exactMatch = findExactArtistMatch(form.value.artistInput);

  if (exactMatch) {
    form.value.selectedArtistId = exactMatch.id;
  } else {
    form.value.selectedArtistId = null;
  }

  showArtistSuggestions.value = true;
}

function handleCategoryInput() {
  const exactMatch = findExactCategoryMatch(form.value.categoryInput);

  if (exactMatch) {
    form.value.selectedCategoryId = exactMatch.id;
  } else {
    form.value.selectedCategoryId = null;
  }

  showCategorySuggestions.value = true;
}

function selectArtist(artist) {
  form.value.artistInput = artist.name;
  form.value.selectedArtistId = artist.id;
  showArtistSuggestions.value = false;
}

function selectCategory(category) {
  form.value.categoryInput = category.name;
  form.value.selectedCategoryId = category.id;
  showCategorySuggestions.value = false;
}

function resetForm() {
  form.value = {
    id: null,
    title: "",
    embedUrl: "",
    coverUrl: "",
    description: "",
    artistInput: "",
    categoryInput: "",
    selectedArtistId: null,
    selectedCategoryId: null,
  };

  showArtistSuggestions.value = false;
  showCategorySuggestions.value = false;
  clearFeedback();
}

function loadTrackIntoForm(track) {
  form.value = {
    id: track.id,
    title: track.title,
    embedUrl: track.embedUrl,
    coverUrl: track.coverUrl,
    description: track.description,
    artistInput: track.customArtistName || track.artist?.name || "",
    categoryInput: track.customCategoryName || track.category?.name || "",
    selectedArtistId: track.artistId ?? null,
    selectedCategoryId: track.categoryId ?? null,
  };

  showArtistSuggestions.value = false;
  showCategorySuggestions.value = false;
  clearFeedback();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadReferenceData() {
  const [artistsResponse, categoriesResponse] = await Promise.all([
    api.get("/artists", { params: { page: 1, limit: 100 } }),
    api.get("/categories", { params: { page: 1, limit: 100 } }),
  ]);

  artistOptions.value = extractCollection(artistsResponse.data).map(
    normalizeOption,
  );
  categoryOptions.value = extractCollection(categoriesResponse.data).map(
    normalizeOption,
  );
}

async function loadTracks({ resetPlayerUi = false } = {}) {
  const response = await api.get("/my-tracks");
  tracks.value = extractCollection(response.data).map(normalizeTrack);

  if (resetPlayerUi) {
    resetAllPlayers();
  }
}

function buildArtistPayload() {
  const exactMatch = findExactArtistMatch(form.value.artistInput);

  if (exactMatch) {
    return {
      artist_id: exactMatch.id,
      custom_artist_name: null,
    };
  }

  if (form.value.selectedArtistId) {
    return {
      artist_id: form.value.selectedArtistId,
      custom_artist_name: null,
    };
  }

  return {
    artist_id: null,
    custom_artist_name: form.value.artistInput.trim(),
  };
}

function buildCategoryPayload() {
  const exactMatch = findExactCategoryMatch(form.value.categoryInput);

  if (exactMatch) {
    return {
      category_id: exactMatch.id,
      custom_category_name: null,
    };
  }

  if (form.value.selectedCategoryId) {
    return {
      category_id: form.value.selectedCategoryId,
      custom_category_name: null,
    };
  }

  return {
    category_id: null,
    custom_category_name: form.value.categoryInput.trim(),
  };
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    fallbackMessage
  );
}

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

function normalizeEmbedUrl(rawUrl) {
  const videoId = extractYouTubeVideoId(rawUrl);

  if (!videoId) {
    return rawUrl.trim();
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

function getPlayerKey(trackId) {
  return String(trackId);
}

function getPlayerHostId(trackId) {
  return `my-track-player-${trackId}`;
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
      } catch {
        // ignore player pause errors
      }
    }
  }
}

function destroyPlayer(trackId, { preserveState = false } = {}) {
  const key = getPlayerKey(trackId);
  const player = playerInstances.get(key);

  if (player && typeof player.destroy === "function") {
    try {
      player.destroy();
    } catch {
      // ignore player destroy errors
    }
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

async function handleSubmit() {
  clearFeedback();

  if (
    !form.value.title.trim() ||
    !form.value.embedUrl.trim() ||
    !form.value.artistInput.trim() ||
    !form.value.categoryInput.trim()
  ) {
    errorMessage.value = "Please fill in the required fields.";
    return;
  }

  const artistPayload = buildArtistPayload();
  const categoryPayload = buildCategoryPayload();

  const payload = {
    title: form.value.title.trim(),
    embed_url: normalizeEmbedUrl(form.value.embedUrl),
    cover_url: form.value.coverUrl.trim() || null,
    description: form.value.description.trim() || null,
    artist_id: artistPayload.artist_id,
    category_id: categoryPayload.category_id,
    custom_artist_name: artistPayload.custom_artist_name,
    custom_category_name: categoryPayload.custom_category_name,
  };

  isSubmitting.value = true;

  try {
    const wasEditing = isEditing.value;

    if (wasEditing) {
      await api.put(`/tracks/${form.value.id}`, payload);
      await loadTracks({ resetPlayerUi: true });
      resetForm();
      successMessage.value = "Track updated successfully.";
    } else {
      await api.post("/tracks", payload);
      await loadTracks({ resetPlayerUi: true });
      resetForm();
      successMessage.value = "Private track created successfully.";
    }
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Something went wrong while saving the track.",
    );
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteTrack(trackId, title) {
  clearFeedback();

  const confirmed = window.confirm(`Delete "${title}" permanently?`);
  if (!confirmed) return;

  try {
    closePlayer(trackId);
    await api.delete(`/tracks/${trackId}`);
    await loadTracks({ resetPlayerUi: true });

    if (form.value.id === trackId) {
      resetForm();
    }

    successMessage.value = "Track deleted successfully.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Something went wrong while deleting the track.",
    );
  }
}

async function initializePage() {
  isInitialLoading.value = true;
  clearFeedback();

  try {
    await Promise.all([loadReferenceData(), loadTracks()]);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to load your tracks right now.",
    );
  } finally {
    isInitialLoading.value = false;
  }
}

onMounted(() => {
  initializePage();
});

onBeforeUnmount(() => {
  resetAllPlayers();
});
</script>

<template>
  <section class="my-tracks-page">
    <section class="my-tracks-topbar">
      <div class="container my-tracks-topbar__inner">
        <div class="my-tracks-heading">
          <h1>My Tracks</h1>
          <p>{{ privateTrackCount }} private tracks</p>
        </div>

        <button
          type="button"
          class="button button--secondary"
          @click="resetForm"
        >
          New track
        </button>
      </div>
    </section>

    <section class="my-tracks-content">
      <div class="container my-tracks-layout">
        <section class="my-tracks-panel">
          <div class="my-tracks-panel__header">
            <div>
              <h2>Track editor</h2>
              <p>
                Create or edit a private track. Existing references are
                suggested while you type.
              </p>
            </div>
          </div>

          <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

          <form class="track-form" @submit.prevent="handleSubmit">
            <div class="track-form__field">
              <label for="track-title">Title</label>
              <input
                id="track-title"
                v-model="form.title"
                type="text"
                placeholder="Enter track title"
              />
            </div>

            <div class="track-form__field">
              <label for="track-embed-url">YouTube URL</label>
              <input
                id="track-embed-url"
                v-model="form.embedUrl"
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div class="track-form__field">
              <label for="track-cover-url">Cover URL</label>
              <input
                id="track-cover-url"
                v-model="form.coverUrl"
                type="text"
                placeholder="https://..."
              />
            </div>

            <div class="track-form__field">
              <label for="track-description">Description</label>
              <textarea
                id="track-description"
                v-model="form.description"
                rows="5"
                placeholder="Describe this track"
              ></textarea>
            </div>

            <div class="track-form__grid">
              <div class="track-form__field track-autocomplete">
                <label for="track-artist">Artist</label>
                <input
                  id="track-artist"
                  v-model="form.artistInput"
                  type="text"
                  placeholder="Start typing an artist..."
                  autocomplete="off"
                  @input="handleArtistInput"
                  @focus="showArtistSuggestions = true"
                  @blur="setTimeout(() => (showArtistSuggestions = false), 150)"
                />

                <div
                  v-if="
                    showArtistSuggestions &&
                    form.artistInput.trim() &&
                    filteredArtistOptions.length
                  "
                  class="track-autocomplete__menu"
                >
                  <button
                    v-for="artist in filteredArtistOptions"
                    :key="artist.id"
                    type="button"
                    class="track-autocomplete__item"
                    @mousedown.prevent="selectArtist(artist)"
                  >
                    {{ artist.name }}
                  </button>
                </div>
              </div>

              <div class="track-form__field track-autocomplete">
                <label for="track-category">Category</label>
                <input
                  id="track-category"
                  v-model="form.categoryInput"
                  type="text"
                  placeholder="Start typing a category..."
                  autocomplete="off"
                  @input="handleCategoryInput"
                  @focus="showCategorySuggestions = true"
                  @blur="
                    setTimeout(() => (showCategorySuggestions = false), 150)
                  "
                />

                <div
                  v-if="
                    showCategorySuggestions &&
                    form.categoryInput.trim() &&
                    filteredCategoryOptions.length
                  "
                  class="track-autocomplete__menu"
                >
                  <button
                    v-for="category in filteredCategoryOptions"
                    :key="category.id"
                    type="button"
                    class="track-autocomplete__item"
                    @mousedown.prevent="selectCategory(category)"
                  >
                    {{ category.name }}
                  </button>
                </div>
              </div>
            </div>

            <p class="track-form__hint">
              Paste a YouTube watch, share, shorts, live, or embed URL. If it is
              a valid YouTube link, it will be normalized and used by the custom
              player below.
            </p>

            <div class="track-form__footer">
              <span class="my-track-status-badge">Private</span>

              <div class="track-form__actions">
                <button
                  type="button"
                  class="button button--ghost"
                  @click="resetForm"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  class="button button--primary"
                  :disabled="isSubmitting"
                >
                  {{
                    isSubmitting
                      ? "Saving..."
                      : isEditing
                        ? "Save changes"
                        : "Create track"
                  }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section class="my-tracks-panel">
          <div class="my-tracks-panel__header">
            <div>
              <h2>Your tracks</h2>
              <p>
                Edit, preview, or remove the tracks that belong to your personal
                library.
              </p>
            </div>
          </div>

          <div v-if="isInitialLoading" class="my-track-empty-state">
            <p>Loading your private tracks...</p>
          </div>

          <div v-else-if="tracks.length" class="my-track-list">
            <article
              v-for="track in tracks"
              :key="track.id"
              class="my-track-card"
            >
              <div
                class="my-track-card__cover"
                :class="{
                  'my-track-card__cover--placeholder': !track.coverUrl,
                }"
                :style="
                  track.coverUrl
                    ? `background-image: url('${track.coverUrl}')`
                    : ''
                "
              ></div>

              <div class="my-track-card__body">
                <div class="my-track-card__top">
                  <div class="my-track-card__top-main">
                    <h3>{{ track.title }}</h3>
                    <p>
                      {{ getTrackArtistLabel(track) }} ·
                      {{ getTrackCategoryLabel(track) }}
                    </p>
                  </div>
                </div>

                <p class="my-track-card__description">
                  {{ track.description || "No description provided." }}
                </p>

                <div class="my-track-card__meta">
                  <span>{{ getTrackPlayerState(track.id).label }}</span>
                  <span>Owner track</span>
                </div>

                <div class="my-track-card__actions">
                  <button
                    type="button"
                    class="button button--secondary button--sm"
                    @click="togglePlayerPanel(track)"
                  >
                    {{ isPlayerOpen(track.id) ? "Hide player" : "Open player" }}
                  </button>

                  <button
                    type="button"
                    class="button button--details button--sm"
                    @click="loadTrackIntoForm(track)"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    class="button button--danger button--sm"
                    @click="deleteTrack(track.id, track.title)"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div v-if="isPlayerOpen(track.id)" class="my-track-player-panel">
                <div class="my-track-player-panel__top">
                  <div>
                    <h4>YouTube player</h4>
                    <p>{{ getTrackPlayerState(track.id).label }}</p>
                  </div>

                  <div class="my-track-player-toolbar">
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
                  class="my-track-player-error"
                >
                  {{ getTrackPlayerState(track.id).error }}
                </p>

                <div
                  v-else
                  class="my-track-player-host"
                  :id="getPlayerHostId(track.id)"
                ></div>
              </div>
            </article>
          </div>

          <div v-else class="my-track-empty-state">
            <p>You have no private tracks yet.</p>
            <button
              type="button"
              class="button button--secondary"
              @click="resetForm"
            >
              Create your first track
            </button>
          </div>
        </section>
      </div>
    </section>
  </section>
</template>
