<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import api from "../services/api";

const route = useRoute();

const artist = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

const actionError = ref("");
const actionSuccess = ref("");
const isSubmittingFavorite = ref(false);
const isFavorite = ref(false);

const currentUser = ref(readStoredUser());
const isAuthenticated = computed(
  () => !!localStorage.getItem("token") && !!currentUser.value,
);

const artistId = computed(() => Number(route.params.id));

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function clearFeedback() {
  actionError.value = "";
  actionSuccess.value = "";
}

function extractCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    fallbackMessage
  );
}

function normalizeArtist(item) {
  return {
    id: item.id,
    name: item.name ?? "Unknown artist",
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? item.image_url ?? "",
    tracks: Array.isArray(item.tracks)
      ? item.tracks.map((track) => ({
          id: track.id,
          title: track.title ?? "",
          description: track.description ?? "",
          coverUrl: track.coverUrl ?? track.cover_url ?? "",
          createdAt: track.createdAt ?? track.created_at ?? null,
          category: track.category
            ? {
                id: track.category.id,
                name: track.category.name ?? "Uncategorized",
              }
            : null,
        }))
      : [],
  };
}

function normalizeFavoriteArtist(item) {
  return {
    id: item.artist?.id ?? item.artistId ?? item.artist_id ?? null,
  };
}

function getArtistInitial(name) {
  return (
    String(name || "?")
      .trim()
      .charAt(0)
      .toUpperCase() || "?"
  );
}

function getArtistCoverStyle(artistValue) {
  if (!artistValue?.imageUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${artistValue.imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function getTrackCoverStyle(track) {
  if (!track?.coverUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${track.coverUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function getTrackCategoryLabel(track) {
  return track?.category?.name || "Uncategorized";
}

function formatDate(dateValue) {
  if (!dateValue) return "Unknown date";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const tracksCount = computed(() => artist.value?.tracks?.length ?? 0);

const categoriesCount = computed(() => {
  if (!artist.value?.tracks?.length) return 0;

  const uniqueNames = new Set(
    artist.value.tracks.map((track) => getTrackCategoryLabel(track)),
  );

  return uniqueNames.size;
});

const latestReleaseLabel = computed(() => {
  const latest = artist.value?.tracks?.[0];
  if (!latest?.createdAt) return "No release date";

  return formatDate(latest.createdAt);
});

const artistProfileText = computed(() => {
  if (artist.value?.description?.trim()) return artist.value.description;

  return "No description is available for this artist yet.";
});

async function loadArtist() {
  const response = await api.get(`/artists/${artistId.value}`);
  artist.value = normalizeArtist(response.data);
}

async function loadFavoriteState() {
  if (!isAuthenticated.value) {
    isFavorite.value = false;
    return;
  }

  const response = await api.get("/favorite-artists");
  const favorites = extractCollection(response.data).map(
    normalizeFavoriteArtist,
  );

  isFavorite.value = favorites.some(
    (favorite) => Number(favorite.id) === artistId.value,
  );
}

async function loadPage() {
  isLoading.value = true;
  errorMessage.value = "";
  clearFeedback();

  try {
    currentUser.value = readStoredUser();
    await loadArtist();
    await loadFavoriteState();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to load this artist right now.",
    );
    artist.value = null;
  } finally {
    isLoading.value = false;
  }
}

async function toggleFavoriteArtist() {
  if (!isAuthenticated.value) {
    actionError.value = "You must be logged in to manage favorite artists.";
    return;
  }

  clearFeedback();
  isSubmittingFavorite.value = true;

  try {
    if (isFavorite.value) {
      await api.delete(`/favorite-artists/${artistId.value}`);
      isFavorite.value = false;
      actionSuccess.value = "Artist removed from favorites.";
    } else {
      await api.post("/favorite-artists", { artist_id: artistId.value });
      isFavorite.value = true;
      actionSuccess.value = "Artist added to favorites.";
    }
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to update favorite artist right now.",
    );
  } finally {
    isSubmittingFavorite.value = false;
  }
}

onMounted(() => {
  loadPage();
});

watch(
  () => route.params.id,
  () => {
    loadPage();
  },
);
</script>

<template>
  <section class="artist-detail-page">
    <div class="container">
      <RouterLink to="/artists" class="artist-detail-back-link">
        ← Back to Artists
      </RouterLink>

      <div v-if="errorMessage" class="artist-detail-panel">
        <p class="auth-error">{{ errorMessage }}</p>
      </div>

      <div v-else-if="isLoading" class="artist-detail-panel">
        <p class="artist-detail-empty-state">Loading artist...</p>
      </div>

      <template v-else-if="artist">
        <section class="artist-detail-hero">
          <div
            class="artist-detail-hero__cover"
            :class="{ 'artist-detail-hero__cover--image': artist.imageUrl }"
            :style="getArtistCoverStyle(artist)"
          >
            <div v-if="!artist.imageUrl" class="artist-detail-hero__monogram">
              {{ getArtistInitial(artist.name) }}
            </div>
          </div>

          <div class="artist-detail-hero__content">
            <p class="artist-detail-eyebrow">Artist profile</p>

            <h1>{{ artist.name }}</h1>

            <p class="artist-detail-description">
              {{ artistProfileText }}
            </p>

            <div class="artist-detail-stats">
              <span
                >{{ tracksCount }} public
                {{ tracksCount === 1 ? "track" : "tracks" }}</span
              >
              <span
                >{{ categoriesCount }}
                {{ categoriesCount === 1 ? "category" : "categories" }}</span
              >
              <span>Latest release: {{ latestReleaseLabel }}</span>
            </div>

            <p v-if="actionError" class="auth-error artist-detail-feedback">
              {{ actionError }}
            </p>
            <p v-if="actionSuccess" class="auth-success artist-detail-feedback">
              {{ actionSuccess }}
            </p>

            <div class="artist-detail-actions">
              <RouterLink to="/tracks" class="button button--ghost">
                Browse catalog
              </RouterLink>

              <button
                type="button"
                class="button"
                :class="isFavorite ? 'button--details' : 'button--ghost'"
                :disabled="isSubmittingFavorite || !isAuthenticated"
                @click="toggleFavoriteArtist"
              >
                {{
                  isSubmittingFavorite
                    ? "Saving..."
                    : isFavorite
                      ? "♥ Favorited"
                      : "♡ Add to favorites"
                }}
              </button>
            </div>

            <p v-if="!isAuthenticated" class="artist-detail-login-hint">
              <RouterLink to="/login">Log in</RouterLink>
              to save this artist to your favorites.
            </p>
          </div>
        </section>

        <div class="artist-detail-layout">
          <section class="artist-detail-panel">
            <div class="artist-detail-panel__header">
              <h2>Artist profile</h2>
            </div>

            <p class="artist-detail-panel__text">
              {{ artistProfileText }}
            </p>
          </section>

          <section class="artist-detail-panel">
            <div class="artist-detail-panel__header">
              <h2>Quick facts</h2>
            </div>

            <div class="artist-facts-list">
              <div class="artist-facts-list__item">
                <span>Name</span>
                <strong>{{ artist.name }}</strong>
              </div>

              <div class="artist-facts-list__item">
                <span>Tracks in catalog</span>
                <strong>{{ tracksCount }}</strong>
              </div>

              <div class="artist-facts-list__item">
                <span>Categories represented</span>
                <strong>{{ categoriesCount }}</strong>
              </div>

              <div class="artist-facts-list__item">
                <span>Latest release</span>
                <strong>{{ latestReleaseLabel }}</strong>
              </div>
            </div>
          </section>
        </div>

        <section class="artist-detail-panel artist-tracks-panel">
          <div class="artist-detail-panel__header">
            <h2>Tracks by this artist</h2>
          </div>

          <div v-if="artist.tracks.length" class="artist-track-list">
            <article
              v-for="track in artist.tracks"
              :key="track.id"
              class="artist-track-row"
            >
              <div
                class="artist-track-row__cover"
                :class="{ 'artist-track-row__cover--image': track.coverUrl }"
                :style="getTrackCoverStyle(track)"
              ></div>

              <div class="artist-track-row__main">
                <h3>{{ track.title }}</h3>
                <p>{{ getTrackCategoryLabel(track) }}</p>
              </div>

              <div class="artist-track-row__rating">
                <span>{{ formatDate(track.createdAt) }}</span>
              </div>

              <RouterLink
                :to="{ name: 'track-detail', params: { id: track.id } }"
                class="button button--details button--sm"
              >
                Details
              </RouterLink>
            </article>
          </div>

          <div v-else class="artist-detail-empty-box">
            <p class="artist-detail-empty-state">
              No public tracks are available for this artist yet.
            </p>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>
