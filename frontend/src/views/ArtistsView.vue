<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";

const alphabet = [
  "All",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const artists = ref([]);
const searchQuery = ref("");
const selectedLetter = ref("All");

const isLoading = ref(true);
const errorMessage = ref("");

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

function normalizeArtist(item) {
  return {
    id: item.id,
    name: item.name ?? "Unknown artist",
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? item.image_url ?? "",
  };
}

function getArtistInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getArtistDescription(artist) {
  if (artist.description?.trim()) return artist.description;

  return "No description available for this artist yet.";
}

function getArtistCoverStyle(artist) {
  if (!artist.imageUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${artist.imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function clearFilters() {
  searchQuery.value = "";
  selectedLetter.value = "All";
}

const filteredArtists = computed(() => {
  let result = [...artists.value];

  const search = normalize(searchQuery.value);

  if (search) {
    result = result.filter((artist) => {
      return (
        normalize(artist.name).includes(search) ||
        normalize(artist.description).includes(search)
      );
    });
  }

  if (selectedLetter.value !== "All") {
    result = result.filter((artist) =>
      normalize(artist.name).startsWith(selectedLetter.value.toLowerCase()),
    );
  }

  result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
});

async function loadArtists() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await api.get("/artists", {
      params: { page: 1, limit: 100 },
    });

    artists.value = extractCollection(response.data).map(normalizeArtist);
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || "Unable to load artists right now.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadArtists();
});
</script>

<template>
  <section class="artists-page">
    <section class="artists-topbar">
      <div class="container artists-topbar__inner">
        <div class="artists-heading">
          <h1>Artists</h1>
          <p>
            {{ filteredArtists.length }}
            {{ filteredArtists.length === 1 ? "artist" : "artists" }}
          </p>
        </div>

        <div class="artists-search-wrap">
          <input
            v-model="searchQuery"
            type="text"
            class="artists-search"
            placeholder="Search an artist..."
          />
        </div>
      </div>
    </section>

    <section class="artists-filters-section">
      <div class="container">
        <div class="artists-alpha-filter">
          <span class="artists-filter-label">Filter</span>

          <div class="artists-alpha-list">
            <button
              v-for="letter in alphabet"
              :key="letter"
              type="button"
              class="artists-alpha-button"
              :class="{ 'is-active': letter === selectedLetter }"
              @click="selectedLetter = letter"
            >
              {{ letter }}
            </button>
          </div>
        </div>

        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

        <div v-if="isLoading" class="artists-empty-state">
          <p>Loading artists...</p>
        </div>

        <template v-else-if="filteredArtists.length">
          <div class="artists-grid">
            <article
              v-for="artist in filteredArtists"
              :key="artist.id"
              class="artist-card"
            >
              <div
                class="artist-card__cover"
                :class="{ 'artist-card__cover--placeholder': !artist.imageUrl }"
                :style="getArtistCoverStyle(artist)"
              >
                <div class="artist-card__badge">
                  {{ getArtistInitials(artist.name) }}
                </div>
              </div>

              <div class="artist-card__body">
                <h3 class="artist-card__name">{{ artist.name }}</h3>
                <p class="artist-card__genres">Catalog artist</p>
                <p class="artist-card__description">
                  {{ getArtistDescription(artist) }}
                </p>

                <div class="artist-card__footer">
                  <span class="artist-card__tracks">Public profile</span>

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
        </template>

        <div v-else class="artists-empty-state">
          <p>No artists match your current filters.</p>
          <button
            type="button"
            class="button button--secondary"
            @click="clearFilters"
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  </section>
</template>
