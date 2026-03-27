<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";

const sortOptions = ["Most recent", "Artist A–Z", "Title A–Z"];

const tracks = ref([]);
const categoryNames = ref([]);

const searchQuery = ref("");
const artistQuery = ref("");
const selectedCategories = ref([]);
const selectedSort = ref("Most recent");

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

function normalizeTrack(track) {
  return {
    id: track.id,
    title: track.title ?? "",
    description: track.description ?? "",
    embedUrl: track.embedUrl ?? track.embed_url ?? "",
    coverUrl: track.coverUrl ?? track.cover_url ?? "",
    createdAt: track.createdAt ?? track.created_at ?? null,
    artist: track.artist ?? null,
    category: track.category ?? null,
    customArtistName:
      track.customArtistName ?? track.custom_artist_name ?? null,
    customCategoryName:
      track.customCategoryName ?? track.custom_category_name ?? null,
  };
}

function getTrackArtistLabel(track) {
  if (track.artist?.name) return track.artist.name;
  if (track.customArtistName) return track.customArtistName;
  return "Unknown artist";
}

function getTrackCategoryLabel(track) {
  if (track.category?.name) return track.category.name;
  if (track.customCategoryName) return track.customCategoryName;
  return "Uncategorized";
}

function getTrackCoverStyle(track) {
  if (!track.coverUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.18), rgba(98, 51, 129, 0.34)), url("${track.coverUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function formatTrackDate(dateValue) {
  if (!dateValue) return "Public track";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Public track";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function clearAllFilters() {
  searchQuery.value = "";
  artistQuery.value = "";
  selectedCategories.value = [];
  selectedSort.value = "Most recent";
}

function removeSelectedCategory(categoryName) {
  selectedCategories.value = selectedCategories.value.filter(
    (name) => name !== categoryName,
  );
}

const categories = computed(() => {
  const counts = new Map();

  for (const track of tracks.value) {
    const categoryName = getTrackCategoryLabel(track);
    counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
  }

  return categoryNames.value.map((name) => ({
    name,
    count: counts.get(name) || 0,
  }));
});

const filteredTracks = computed(() => {
  let result = [...tracks.value];

  const search = normalize(searchQuery.value);
  const artist = normalize(artistQuery.value);

  if (search) {
    result = result.filter((track) => {
      return (
        normalize(track.title).includes(search) ||
        normalize(track.description).includes(search) ||
        normalize(getTrackArtistLabel(track)).includes(search) ||
        normalize(getTrackCategoryLabel(track)).includes(search)
      );
    });
  }

  if (artist) {
    result = result.filter((track) =>
      normalize(getTrackArtistLabel(track)).includes(artist),
    );
  }

  if (selectedCategories.value.length) {
    result = result.filter((track) =>
      selectedCategories.value.includes(getTrackCategoryLabel(track)),
    );
  }

  if (selectedSort.value === "Artist A–Z") {
    result.sort((a, b) =>
      getTrackArtistLabel(a).localeCompare(getTrackArtistLabel(b)),
    );
  } else if (selectedSort.value === "Title A–Z") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  return result;
});

async function loadCatalogData() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [tracksResponse, categoriesResponse] = await Promise.all([
      api.get("/tracks", { params: { page: 1, limit: 100 } }),
      api.get("/categories", { params: { page: 1, limit: 100 } }),
    ]);

    tracks.value = extractCollection(tracksResponse.data).map(normalizeTrack);

    const officialCategoryNames = extractCollection(
      categoriesResponse.data,
    ).map((category) => category.name);

    const trackCategoryNames = tracks.value.map((track) =>
      getTrackCategoryLabel(track),
    );

    categoryNames.value = [
      ...new Set([...officialCategoryNames, ...trackCategoryNames]),
    ].sort((a, b) => a.localeCompare(b));
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || "Unable to load the catalog right now.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadCatalogData();
});
</script>

<template>
  <section class="catalog-page">
    <section class="catalog-topbar">
      <div class="container catalog-topbar__inner">
        <div class="catalog-heading">
          <h1>Catalog</h1>
          <p>
            {{ filteredTracks.length }}
            {{ filteredTracks.length === 1 ? "track" : "tracks" }}
          </p>
        </div>

        <div class="catalog-view-toggle" aria-label="View mode">
          <button type="button" class="catalog-view-toggle__button is-active">
            ▦ Grid
          </button>
          <button
            type="button"
            class="catalog-view-toggle__button"
            disabled
            title="List mode not implemented yet"
          >
            ☰ List
          </button>
        </div>
      </div>
    </section>

    <section class="catalog-content-section">
      <div class="container catalog-layout">
        <aside class="catalog-sidebar">
          <div class="catalog-filter-block">
            <label class="catalog-filter-label" for="track-search"
              >Search</label
            >
            <input
              id="track-search"
              v-model="searchQuery"
              type="text"
              class="catalog-input"
              placeholder="Track title, artist..."
            />
          </div>

          <div class="catalog-filter-block">
            <div class="catalog-filter-label">Category</div>

            <div class="catalog-category-list">
              <label
                v-for="category in categories"
                :key="category.name"
                class="catalog-category-item"
              >
                <input
                  v-model="selectedCategories"
                  type="checkbox"
                  :value="category.name"
                />
                <span>{{ category.name }}</span>
                <small>{{ category.count }}</small>
              </label>
            </div>
          </div>

          <div class="catalog-filter-block">
            <label class="catalog-filter-label" for="artist-filter"
              >Artist</label
            >
            <input
              id="artist-filter"
              v-model="artistQuery"
              type="text"
              class="catalog-input"
              placeholder="Filter by artist..."
            />
          </div>

          <div class="catalog-filter-block">
            <label class="catalog-filter-label" for="sort-by">Sort by</label>
            <select id="sort-by" v-model="selectedSort" class="catalog-select">
              <option
                v-for="option in sortOptions"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </div>
        </aside>

        <div class="catalog-main">
          <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>

          <div v-if="selectedCategories.length" class="catalog-active-filters">
            <button
              v-for="category in selectedCategories"
              :key="category"
              type="button"
              class="catalog-chip"
              @click="removeSelectedCategory(category)"
            >
              {{ category }} ×
            </button>

            <button
              type="button"
              class="catalog-clear"
              @click="clearAllFilters"
            >
              Clear all
            </button>
          </div>

          <div v-if="isLoading" class="catalog-empty-state">
            <p>Loading public tracks...</p>
          </div>

          <div v-else-if="filteredTracks.length" class="catalog-grid">
            <article
              v-for="track in filteredTracks"
              :key="track.id"
              class="catalog-card"
            >
              <div
                class="catalog-card__cover"
                :style="getTrackCoverStyle(track)"
              >
                <RouterLink
                  :to="{ name: 'track-detail', params: { id: track.id } }"
                  class="catalog-card__play"
                >
                  ▶
                </RouterLink>
              </div>

              <div class="catalog-card__body">
                <p class="catalog-card__category">
                  {{ getTrackCategoryLabel(track) }}
                </p>

                <h3 class="catalog-card__title">{{ track.title }}</h3>

                <p class="catalog-card__artist">
                  {{ getTrackArtistLabel(track) }}
                </p>

                <div class="catalog-card__footer">
                  <div class="catalog-card__rating">
                    <span>{{ formatTrackDate(track.createdAt) }}</span>
                  </div>

                  <RouterLink
                    :to="{ name: 'track-detail', params: { id: track.id } }"
                    class="button button--details button--sm"
                  >
                    Details →
                  </RouterLink>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="catalog-empty-state">
            <p>No tracks match your current filters.</p>
            <button
              type="button"
              class="button button--secondary"
              @click="clearAllFilters"
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
