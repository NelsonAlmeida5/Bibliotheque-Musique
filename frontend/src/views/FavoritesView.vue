<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";

const activeTab = ref("all");
const searchQuery = ref("");

const favoriteTracks = ref([]);
const favoriteArtists = ref([]);

const isLoading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

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

/* -------------------- Track favorites -------------------- */
function normalizeFavoriteTrack(item) {
  const track = item.track ?? item;

  return {
    id: track.id ?? item.trackId ?? item.track_id ?? item.id,
    title: track.title ?? "Untitled track",
    artist:
      track.artist?.name ??
      track.customArtistName ??
      track.custom_artist_name ??
      "Unknown artist",
    category:
      track.category?.name ??
      track.customCategoryName ??
      track.custom_category_name ??
      "Uncategorized",
    coverUrl: track.coverUrl ?? track.cover_url ?? "",
    description: track.description ?? "",
  };
}

function getTrackCoverStyle(track) {
  if (!track.coverUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${track.coverUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

/* -------------------- Artist favorites -------------------- */
function normalizeFavoriteArtist(item) {
  const artist = item.artist ?? item;

  return {
    id: artist.id ?? item.artistId ?? item.artist_id ?? item.id,
    name: artist.name ?? "Unknown artist",
    imageUrl: artist.imageUrl ?? artist.image_url ?? "",
    description: artist.description ?? "",
    tracksCount: Array.isArray(artist.tracks) ? artist.tracks.length : null,
  };
}

function getArtistCoverStyle(artist) {
  if (!artist.imageUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${artist.imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function getArtistDescription(artist) {
  if (artist.description?.trim()) return artist.description;
  return "No description available for this artist yet.";
}

function getArtistFooterLabel(artist) {
  if (artist.tracksCount !== null) {
    return `${artist.tracksCount} ${artist.tracksCount === 1 ? "track" : "tracks"}`;
  }

  return "Saved artist";
}

/* -------------------- Search -------------------- */
const searchPlaceholder = computed(() => {
  if (activeTab.value === "tracks") return "Search favorite tracks...";
  if (activeTab.value === "artists") return "Search favorite artists...";
  return "Search favorites...";
});

const filteredFavoriteTracks = computed(() => {
  const search = normalize(searchQuery.value);
  if (!search) return favoriteTracks.value;

  return favoriteTracks.value.filter((track) => {
    return (
      normalize(track.title).includes(search) ||
      normalize(track.artist).includes(search) ||
      normalize(track.category).includes(search) ||
      normalize(track.description).includes(search)
    );
  });
});

const filteredFavoriteArtists = computed(() => {
  const search = normalize(searchQuery.value);
  if (!search) return favoriteArtists.value;

  return favoriteArtists.value.filter((artist) => {
    return (
      normalize(artist.name).includes(search) ||
      normalize(artist.description).includes(search)
    );
  });
});

const hasSearch = computed(() => !!searchQuery.value.trim());

const visibleTrackCount = computed(() => filteredFavoriteTracks.value.length);
const visibleArtistCount = computed(() => filteredFavoriteArtists.value.length);
const visibleTotalCount = computed(
  () => visibleTrackCount.value + visibleArtistCount.value,
);

const topbarSummary = computed(() => {
  if (!hasSearch.value) {
    return `${favoriteTracks.value.length + favoriteArtists.value.length} favorites · ${favoriteTracks.value.length} tracks · ${favoriteArtists.value.length} artists`;
  }

  if (activeTab.value === "tracks") {
    return `${visibleTrackCount.value} matching ${visibleTrackCount.value === 1 ? "track" : "tracks"}`;
  }

  if (activeTab.value === "artists") {
    return `${visibleArtistCount.value} matching ${visibleArtistCount.value === 1 ? "artist" : "artists"}`;
  }

  return `${visibleTotalCount.value} matching favorites · ${visibleTrackCount.value} tracks · ${visibleArtistCount.value} artists`;
});

const showTracksSection = computed(() => {
  if (activeTab.value === "tracks") return true;
  if (activeTab.value === "all") {
    if (!hasSearch.value) return true;
    return visibleTrackCount.value > 0;
  }
  return false;
});

const showArtistsSection = computed(() => {
  if (activeTab.value === "artists") return true;
  if (activeTab.value === "all") {
    if (!hasSearch.value) return true;
    return visibleArtistCount.value > 0;
  }
  return false;
});

const showGlobalEmptySearchState = computed(() => {
  if (!hasSearch.value) return false;

  if (activeTab.value === "tracks") {
    return visibleTrackCount.value === 0;
  }

  if (activeTab.value === "artists") {
    return visibleArtistCount.value === 0;
  }

  return visibleTotalCount.value === 0;
});

/* -------------------- Loaders -------------------- */
async function loadFavorites() {
  isLoading.value = true;
  clearFeedback();

  try {
    const [tracksResponse, artistsResponse] = await Promise.all([
      api.get("/favorite-tracks"),
      api.get("/favorite-artists"),
    ]);

    favoriteTracks.value = extractCollection(tracksResponse.data)
      .map(normalizeFavoriteTrack)
      .filter((item) => item.id);

    favoriteArtists.value = extractCollection(artistsResponse.data)
      .map(normalizeFavoriteArtist)
      .filter((item) => item.id);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to load your favorites right now.",
    );
  } finally {
    isLoading.value = false;
  }
}

/* -------------------- Actions -------------------- */
async function removeFavoriteTrack(trackId, title) {
  clearFeedback();

  const confirmed = window.confirm(`Remove "${title}" from favorite tracks?`);
  if (!confirmed) return;

  try {
    await api.delete(`/favorite-tracks/${trackId}`);
    favoriteTracks.value = favoriteTracks.value.filter(
      (track) => Number(track.id) !== Number(trackId),
    );
    successMessage.value = "Track removed from favorites.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to remove this favorite track.",
    );
  }
}

async function removeFavoriteArtist(artistId, name) {
  clearFeedback();

  const confirmed = window.confirm(`Remove "${name}" from favorite artists?`);
  if (!confirmed) return;

  try {
    await api.delete(`/favorite-artists/${artistId}`);
    favoriteArtists.value = favoriteArtists.value.filter(
      (artist) => Number(artist.id) !== Number(artistId),
    );
    successMessage.value = "Artist removed from favorites.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to remove this favorite artist.",
    );
  }
}

onMounted(() => {
  loadFavorites();
});
</script>

<template>
  <section class="favorites-page">
    <section class="favorites-topbar">
      <div class="container favorites-topbar__inner">
        <div class="favorites-heading">
          <h1>Favorites</h1>
          <p>{{ topbarSummary }}</p>
        </div>

        <div class="favorites-topbar__controls">
          <input
            v-model="searchQuery"
            type="text"
            class="favorites-search"
            :placeholder="searchPlaceholder"
          />

          <div class="favorites-tabs">
            <button
              type="button"
              class="favorites-tabs__button"
              :class="{ 'is-active': activeTab === 'all' }"
              @click="activeTab = 'all'"
            >
              All
            </button>

            <button
              type="button"
              class="favorites-tabs__button"
              :class="{ 'is-active': activeTab === 'tracks' }"
              @click="activeTab = 'tracks'"
            >
              Tracks
            </button>

            <button
              type="button"
              class="favorites-tabs__button"
              :class="{ 'is-active': activeTab === 'artists' }"
              @click="activeTab = 'artists'"
            >
              Artists
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="favorites-content">
      <div class="container">
        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

        <div v-if="isLoading" class="favorites-empty-state">
          <p>Loading favorites...</p>
        </div>

        <template v-else>
          <div v-if="showGlobalEmptySearchState" class="favorites-empty-state">
            <p>No favorites match your current search.</p>
          </div>

          <section
            v-if="showTracksSection && !showGlobalEmptySearchState"
            class="favorites-section"
          >
            <div class="favorites-section__header">
              <div>
                <h2>Favorite Tracks</h2>
                <p>The tracks you want to keep close.</p>
              </div>

              <span class="favorites-section__count">
                {{ visibleTrackCount }}
              </span>
            </div>

            <div
              v-if="filteredFavoriteTracks.length"
              class="favorite-track-grid"
            >
              <article
                v-for="track in filteredFavoriteTracks"
                :key="track.id"
                class="favorite-track-card"
              >
                <div
                  class="favorite-track-card__cover"
                  :style="getTrackCoverStyle(track)"
                >
                  <button
                    type="button"
                    class="favorite-card__heart"
                    @click="removeFavoriteTrack(track.id, track.title)"
                    title="Remove from favorites"
                  >
                    ♥
                  </button>
                </div>

                <div class="favorite-track-card__body">
                  <p class="favorite-track-card__category">
                    {{ track.category }}
                  </p>
                  <h3>{{ track.title }}</h3>
                  <p class="favorite-track-card__artist">{{ track.artist }}</p>

                  <div class="favorite-track-card__footer">
                    <div class="favorite-track-card__rating">
                      <span>Saved track</span>
                    </div>

                    <RouterLink
                      :to="{ name: 'track-detail', params: { id: track.id } }"
                      class="button button--details button--sm"
                    >
                      Details
                    </RouterLink>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else-if="activeTab === 'tracks'"
              class="favorites-empty-state"
            >
              <p>No favorite tracks match your search.</p>
            </div>

            <div v-else class="favorites-empty-state">
              <p>No favorite tracks yet.</p>
              <RouterLink
                to="/tracks"
                class="button button--secondary button--sm"
              >
                Browse catalog
              </RouterLink>
            </div>
          </section>

          <section
            v-if="showArtistsSection && !showGlobalEmptySearchState"
            class="favorites-section"
          >
            <div class="favorites-section__header">
              <div>
                <h2>Favorite Artists</h2>
                <p>The artists you keep returning to.</p>
              </div>

              <span class="favorites-section__count">
                {{ visibleArtistCount }}
              </span>
            </div>

            <div
              v-if="filteredFavoriteArtists.length"
              class="favorite-artist-grid"
            >
              <article
                v-for="artist in filteredFavoriteArtists"
                :key="artist.id"
                class="favorite-artist-card"
              >
                <div
                  class="favorite-artist-card__cover"
                  :style="getArtistCoverStyle(artist)"
                >
                  <button
                    type="button"
                    class="favorite-card__heart"
                    @click="removeFavoriteArtist(artist.id, artist.name)"
                    title="Remove from favorites"
                  >
                    ♥
                  </button>
                </div>

                <div class="favorite-artist-card__body">
                  <h3>{{ artist.name }}</h3>
                  <p class="favorite-artist-card__genres">Favorite artist</p>
                  <p class="favorite-artist-card__description">
                    {{ getArtistDescription(artist) }}
                  </p>

                  <div class="favorite-artist-card__footer">
                    <span>{{ getArtistFooterLabel(artist) }}</span>

                    <RouterLink
                      :to="{ name: 'artist-detail', params: { id: artist.id } }"
                      class="button button--details button--sm"
                    >
                      Details
                    </RouterLink>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-else-if="activeTab === 'artists'"
              class="favorites-empty-state"
            >
              <p>No favorite artists match your search.</p>
            </div>

            <div v-else class="favorites-empty-state">
              <p>No favorite artists yet.</p>
              <RouterLink
                to="/artists"
                class="button button--secondary button--sm"
              >
                Browse artists
              </RouterLink>
            </div>
          </section>
        </template>
      </div>
    </section>
  </section>
</template>
