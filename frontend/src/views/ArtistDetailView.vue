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

function normalizeTrackLink(item) {
  if (!item?.id) return null;

  return {
    id: item.id,
    title: item.title ?? "Untitled track",
    favoriteCount: Number(item.favoriteCount ?? 0),
    averageRating: Number(item.averageRating ?? 0),
    ratingsCount: Number(item.ratingsCount ?? 0),
    weightedRating: Number(item.weightedRating ?? 0),
  };
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
    latestTrackInCatalog: normalizeTrackLink(item.latestTrackInCatalog),
    categoriesRepresented: {
      count: Number(item.categoriesRepresented?.count ?? 0),
      names: Array.isArray(item.categoriesRepresented?.names)
        ? item.categoriesRepresented.names
        : [],
    },
    artistFavoritesCount: Number(item.artistFavoritesCount ?? 0),
    mostFavoritedTrack: normalizeTrackLink(item.mostFavoritedTrack),
    highestRatedTrack: normalizeTrackLink(item.highestRatedTrack),
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
    backgroundImage: `url("${artistValue.imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

const tracksCount = computed(() => artist.value?.tracks?.length ?? 0);

const artistCategoryNames = computed(() => {
  return artist.value?.categoriesRepresented?.names ?? [];
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
            <h1>{{ artist.name }}</h1>

            <div class="artist-detail-stats">
              <span>
                {{ tracksCount }} catalog
                {{ tracksCount === 1 ? "track" : "tracks" }}
              </span>
            </div>

            <div
              v-if="artistCategoryNames.length"
              class="artist-detail-categories"
            >
              <span
                v-for="(categoryName, index) in artistCategoryNames"
                :key="`${categoryName}-${index}`"
                class="artist-detail-category-tag"
              >
                {{ categoryName
                }}<span v-if="index < artistCategoryNames.length - 1">,</span>
              </span>
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
          <section class="artist-detail-panel artist-detail-panel--facts">
            <div class="artist-detail-panel__header">
              <h2>Artist profile</h2>
            </div>

            <p class="artist-detail-panel__text">
              {{ artistProfileText }}
            </p>
          </section>

          <section class="artist-detail-panel artist-detail-panel--facts">
            <div class="artist-detail-panel__header">
              <h2>Quick facts</h2>
            </div>

            <div class="artist-facts-list">
              <div class="artist-facts-list__item">
                <span>Latest track in catalog</span>

                <RouterLink
                  v-if="artist.latestTrackInCatalog"
                  :to="{
                    name: 'track-detail',
                    params: { id: artist.latestTrackInCatalog.id },
                  }"
                  class="artist-fact-link"
                >
                  {{ artist.latestTrackInCatalog.title }}
                </RouterLink>

                <strong v-else>—</strong>
              </div>

              <div class="artist-facts-list__item">
                <span>Artist favorites</span>
                <strong>{{ artist.artistFavoritesCount }}</strong>
              </div>

              <div class="artist-facts-list__item">
                <span>Most favorited track</span>

                <RouterLink
                  v-if="artist.mostFavoritedTrack"
                  :to="{
                    name: 'track-detail',
                    params: { id: artist.mostFavoritedTrack.id },
                  }"
                  class="artist-fact-link"
                >
                  {{ artist.mostFavoritedTrack.title }}
                </RouterLink>

                <strong v-else>No favorites yet</strong>
              </div>

              <div class="artist-facts-list__item">
                <span>Highest rated track</span>

                <RouterLink
                  v-if="artist.highestRatedTrack"
                  :to="{
                    name: 'track-detail',
                    params: { id: artist.highestRatedTrack.id },
                  }"
                  class="artist-fact-link"
                >
                  {{ artist.highestRatedTrack.title }}
                </RouterLink>

                <strong v-else>Not enough ratings yet</strong>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>
  </section>
</template>
