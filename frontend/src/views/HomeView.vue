<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";

const stats = ref({
  tracks: 0,
  artists: 0,
  categories: 0,
  avgRating: 0,
});

const highlights = ref([]);
const favoriteTrackIds = ref([]);

const isLoading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

const isAuthenticated = computed(() => !!localStorage.getItem("token"));

function clearFeedback() {
  errorMessage.value = "";
  successMessage.value = "";
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

function normalizeHighlight(item) {
  return {
    id: item.id,
    title: item.title ?? "Untitled track",
    coverUrl: item.cover_url ?? item.coverUrl ?? "",
    artistName:
      item.artist?.name ?? item.custom_artist_name ?? "Unknown artist",
    categoryName:
      item.category?.name ?? item.custom_category_name ?? "Uncategorized",
    averageRating: Number(item.average_rating ?? 0),
    ratingsCount: Number(item.ratings_count ?? 0),
  };
}

function normalizeFavoriteTrack(item) {
  return item.track?.id ?? item.trackId ?? item.track_id ?? null;
}

function formatIndex(index) {
  return String(index + 1).padStart(2, "0");
}

function formatAverageRating(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return value.toFixed(1);
}

function getStars(value) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

function getHighlightCoverStyle(track) {
  if (!track.coverUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(192, 24, 42, 0.18), rgba(89, 200, 255, 0.12)), url("${track.coverUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function isTrackFavorite(trackId) {
  return favoriteTrackIds.value.includes(Number(trackId));
}

async function loadFavoriteTracks() {
  if (!isAuthenticated.value) {
    favoriteTrackIds.value = [];
    return;
  }

  const response = await api.get("/favorite-tracks");
  favoriteTrackIds.value = extractCollection(response.data)
    .map(normalizeFavoriteTrack)
    .filter(Boolean)
    .map((id) => Number(id));
}

async function loadHomeData() {
  isLoading.value = true;
  clearFeedback();

  try {
    const [homeResponse] = await Promise.all([
      api.get("/home"),
      loadFavoriteTracks(),
    ]);

    stats.value = {
      tracks: Number(homeResponse.data?.stats?.tracks ?? 0),
      artists: Number(homeResponse.data?.stats?.artists ?? 0),
      categories: Number(homeResponse.data?.stats?.categories ?? 0),
      avgRating: Number(homeResponse.data?.stats?.avg_rating ?? 0),
    };

    highlights.value = extractCollection(homeResponse.data?.highlights).map(
      normalizeHighlight,
    );
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to load the home page right now.",
    );
  } finally {
    isLoading.value = false;
  }
}

async function toggleFavoriteTrack(track) {
  clearFeedback();

  if (!isAuthenticated.value) {
    errorMessage.value = "You must be logged in to manage favorite tracks.";
    return;
  }

  const trackId = Number(track.id);

  try {
    if (isTrackFavorite(trackId)) {
      await api.delete(`/favorite-tracks/${trackId}`);
      favoriteTrackIds.value = favoriteTrackIds.value.filter(
        (id) => id !== trackId,
      );
      successMessage.value = "Track removed from favorites.";
    } else {
      await api.post("/favorite-tracks", { track_id: trackId });
      favoriteTrackIds.value = [...favoriteTrackIds.value, trackId];
      successMessage.value = "Track added to favorites.";
    }
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to update favorite track right now.",
    );
  }
}

onMounted(() => {
  loadHomeData();
});
</script>

<template>
  <section class="home-page">
    <section class="home-hero">
      <div class="container home-hero__inner">
        <div class="home-hero__content">
          <h1 class="home-hero__title">
            Music worth
            <span>remembering.</span>
          </h1>

          <p class="home-hero__text">
            A carefully curated library across all genres — dark, atmospheric,
            emotional, and everything in between.
          </p>

          <div class="home-hero__actions">
            <RouterLink to="/tracks" class="button button--primary">
              Explore catalog
            </RouterLink>

            <RouterLink to="/artists" class="button button--secondary">
              Browse artists
            </RouterLink>
          </div>

          <div class="home-stats">
            <div class="home-stat">
              <strong>{{ stats.tracks }}</strong>
              <span>Tracks</span>
            </div>

            <div class="home-stat">
              <strong>{{ stats.artists }}</strong>
              <span>Artists</span>
            </div>

            <div class="home-stat">
              <strong>{{ stats.categories }}</strong>
              <span>Categories</span>
            </div>

            <div class="home-stat">
              <strong>{{ formatAverageRating(stats.avgRating) }}</strong>
              <span>Avg Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="home-highlights">
      <div class="container">
        <div class="section-heading">
          <h2>This week’s highlights</h2>
          <RouterLink to="/tracks" class="section-link">
            View full catalog →
          </RouterLink>
        </div>

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

        <div v-if="isLoading" class="home-loading-panel">
          <p>Loading highlights...</p>
        </div>

        <div v-else-if="highlights.length" class="highlight-list">
          <article
            v-for="(track, index) in highlights"
            :key="track.id"
            class="highlight-row"
          >
            <div class="highlight-row__index">{{ formatIndex(index) }}</div>

            <div class="highlight-row__track">
              <div
                class="highlight-cover"
                :style="getHighlightCoverStyle(track)"
              ></div>

              <div>
                <h3>{{ track.title }}</h3>
                <p>{{ track.artistName }}</p>
              </div>
            </div>

            <div class="highlight-row__category">{{ track.categoryName }}</div>

            <div class="highlight-row__rating">
              <span class="stars">{{ getStars(track.averageRating) }}</span>
              <span>{{ formatAverageRating(track.averageRating) }}</span>
            </div>

            <div class="highlight-row__actions">
              <button
                class="icon-button"
                type="button"
                :title="
                  isTrackFavorite(track.id)
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                "
                @click="toggleFavoriteTrack(track)"
              >
                {{ isTrackFavorite(track.id) ? "♥" : "♡" }}
              </button>

              <RouterLink
                :to="{ name: 'track-detail', params: { id: track.id } }"
                class="button button--details button--sm"
              >
                Details →
              </RouterLink>
            </div>
          </article>
        </div>

        <div v-else class="home-loading-panel">
          <p>No highlights available yet.</p>
        </div>
      </div>
    </section>
  </section>
</template>
