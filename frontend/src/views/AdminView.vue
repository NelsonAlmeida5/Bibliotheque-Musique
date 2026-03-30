<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";

const activeTab = ref("overview");

/* -------------------- Global state -------------------- */
const isLoading = ref(true);
const pageError = ref("");
const actionError = ref("");
const actionSuccess = ref("");

/* -------------------- Search -------------------- */
const artistSearch = ref("");
const categorySearch = ref("");
const trackSearch = ref("");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
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

/* -------------------- Normalizers -------------------- */
function normalizeArtist(item) {
  return {
    id: item.id,
    name: item.name ?? "",
    imageUrl: item.imageUrl ?? item.image_url ?? "",
    description: item.description ?? "",
  };
}

function normalizeCategory(item) {
  return {
    id: item.id,
    name: item.name ?? "",
    description: item.description ?? "",
  };
}

function normalizeTrack(item) {
  return {
    id: item.id,
    title: item.title ?? "",
    description: item.description ?? "",
    coverUrl: item.coverUrl ?? item.cover_url ?? "",
    isPublic: item.isPublic ?? item.is_public ?? false,
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
    owner: item.user?.username ?? item.user?.email ?? "Unknown owner",
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

/* -------------------- Data -------------------- */
const artists = ref([]);
const categories = ref([]);
const tracks = ref([]);

/* -------------------- Artists -------------------- */
const filteredArtists = computed(() => {
  const search = normalize(artistSearch.value);
  if (!search) return artists.value;

  return artists.value.filter((artist) => {
    return (
      normalize(artist.name).includes(search) ||
      normalize(artist.description).includes(search)
    );
  });
});

const artistForm = ref({
  id: null,
  name: "",
  imageUrl: "",
  description: "",
});

const isEditingArtist = computed(() => artistForm.value.id !== null);

/* -------------------- Categories -------------------- */
const filteredCategories = computed(() => {
  const search = normalize(categorySearch.value);
  if (!search) return categories.value;

  return categories.value.filter((category) => {
    return (
      normalize(category.name).includes(search) ||
      normalize(category.description).includes(search)
    );
  });
});

const categoryForm = ref({
  id: null,
  name: "",
  description: "",
});

const isEditingCategory = computed(() => categoryForm.value.id !== null);

/* -------------------- Tracks -------------------- */
const filteredTracks = computed(() => {
  const search = normalize(trackSearch.value);
  if (!search) return tracks.value;

  return tracks.value.filter((track) => {
    const visibility = track.isPublic ? "public" : "private";

    return (
      normalize(track.title).includes(search) ||
      normalize(track.artist).includes(search) ||
      normalize(track.category).includes(search) ||
      normalize(track.owner).includes(search) ||
      visibility.includes(search)
    );
  });
});

/* -------------------- Overview -------------------- */
const totalArtists = computed(() => artists.value.length);
const totalCategories = computed(() => categories.value.length);
const totalTracks = computed(() => tracks.value.length);
const publicTracks = computed(
  () => tracks.value.filter((track) => track.isPublic).length,
);

/* -------------------- Loaders -------------------- */
async function loadArtists() {
  const response = await api.get("/artists", {
    params: { page: 1, limit: 100 },
  });
  artists.value = extractCollection(response.data).map(normalizeArtist);
}

async function loadCategories() {
  const response = await api.get("/categories", {
    params: { page: 1, limit: 100 },
  });
  categories.value = extractCollection(response.data).map(normalizeCategory);
}

async function loadTracks() {
  const response = await api.get("/tracks", {
    params: { page: 1, limit: 100 },
  });
  tracks.value = extractCollection(response.data).map(normalizeTrack);
}

async function loadAdminData() {
  isLoading.value = true;
  pageError.value = "";
  clearFeedback();

  try {
    await Promise.all([loadArtists(), loadCategories(), loadTracks()]);
  } catch (error) {
    pageError.value = getApiErrorMessage(
      error,
      "Unable to load admin data right now.",
    );
  } finally {
    isLoading.value = false;
  }
}

/* -------------------- Artist actions -------------------- */
function resetArtistForm() {
  artistForm.value = {
    id: null,
    name: "",
    imageUrl: "",
    description: "",
  };
}

function editArtist(artist) {
  artistForm.value = {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl,
    description: artist.description,
  };
  activeTab.value = "artists";
  clearFeedback();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveArtist() {
  clearFeedback();

  if (!artistForm.value.name.trim()) {
    actionError.value = "Artist name is required.";
    return;
  }

  const payload = {
    name: artistForm.value.name.trim(),
    image_url: artistForm.value.imageUrl.trim() || null,
    description: artistForm.value.description.trim() || null,
  };

  try {
    if (isEditingArtist.value) {
      await api.put(`/artists/${artistForm.value.id}`, payload);
      actionSuccess.value = "Artist updated successfully.";
    } else {
      await api.post("/artists", payload);
      actionSuccess.value = "Artist created successfully.";
    }

    await loadArtists();
    resetArtistForm();
  } catch (error) {
    actionError.value = getApiErrorMessage(error, "Unable to save the artist.");
  }
}

async function deleteArtist(id, name) {
  clearFeedback();

  const confirmed = window.confirm(`Delete artist "${name}" permanently?`);
  if (!confirmed) return;

  try {
    await api.delete(`/artists/${id}`);
    await loadArtists();

    if (artistForm.value.id === id) {
      resetArtistForm();
    }

    actionSuccess.value = "Artist deleted successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to delete the artist.",
    );
  }
}

/* -------------------- Category actions -------------------- */
function resetCategoryForm() {
  categoryForm.value = {
    id: null,
    name: "",
    description: "",
  };
}

function editCategory(category) {
  categoryForm.value = {
    id: category.id,
    name: category.name,
    description: category.description,
  };
  activeTab.value = "categories";
  clearFeedback();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveCategory() {
  clearFeedback();

  if (!categoryForm.value.name.trim()) {
    actionError.value = "Category name is required.";
    return;
  }

  const payload = {
    name: categoryForm.value.name.trim(),
    description: categoryForm.value.description.trim() || null,
  };

  try {
    if (isEditingCategory.value) {
      await api.put(`/categories/${categoryForm.value.id}`, payload);
      actionSuccess.value = "Category updated successfully.";
    } else {
      await api.post("/categories", payload);
      actionSuccess.value = "Category created successfully.";
    }

    await loadCategories();
    resetCategoryForm();
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to save the category.",
    );
  }
}

async function deleteCategory(id, name) {
  clearFeedback();

  const confirmed = window.confirm(`Delete category "${name}" permanently?`);
  if (!confirmed) return;

  try {
    await api.delete(`/categories/${id}`);
    await loadCategories();

    if (categoryForm.value.id === id) {
      resetCategoryForm();
    }

    actionSuccess.value = "Category deleted successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to delete the category.",
    );
  }
}

/* -------------------- Track actions -------------------- */
async function deleteTrack(id, title) {
  clearFeedback();

  const confirmed = window.confirm(`Delete track "${title}" permanently?`);
  if (!confirmed) return;

  try {
    await api.delete(`/tracks/${id}`);
    await loadTracks();
    actionSuccess.value = "Track deleted successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to delete the track.",
    );
  }
}

onMounted(() => {
  loadAdminData();
});
</script>

<template>
  <section class="admin-page">
    <section class="admin-topbar">
      <div class="container admin-topbar__inner">
        <div class="admin-heading">
          <h1>Admin Panel</h1>
          <p>Manage artists, categories, and catalog moderation.</p>
        </div>

        <div class="admin-tabs">
          <button
            type="button"
            class="admin-tabs__button"
            :class="{ 'is-active': activeTab === 'overview' }"
            @click="activeTab = 'overview'"
          >
            Overview
          </button>

          <button
            type="button"
            class="admin-tabs__button"
            :class="{ 'is-active': activeTab === 'artists' }"
            @click="activeTab = 'artists'"
          >
            Artists
          </button>

          <button
            type="button"
            class="admin-tabs__button"
            :class="{ 'is-active': activeTab === 'categories' }"
            @click="activeTab = 'categories'"
          >
            Categories
          </button>

          <button
            type="button"
            class="admin-tabs__button"
            :class="{ 'is-active': activeTab === 'tracks' }"
            @click="activeTab = 'tracks'"
          >
            Tracks
          </button>
        </div>
      </div>
    </section>

    <section class="admin-content">
      <div class="container">
        <p v-if="pageError" class="auth-error">{{ pageError }}</p>
        <p v-if="actionError" class="auth-error">{{ actionError }}</p>
        <p v-if="actionSuccess" class="auth-success">{{ actionSuccess }}</p>

        <div v-if="isLoading" class="admin-empty-state">
          <p>Loading admin data...</p>
        </div>

        <template v-else>
          <!-- Overview -->
          <section v-if="activeTab === 'overview'" class="admin-overview">
            <div class="admin-stats-grid">
              <article class="admin-stat-card">
                <span>Artists</span>
                <strong>{{ totalArtists }}</strong>
              </article>

              <article class="admin-stat-card">
                <span>Categories</span>
                <strong>{{ totalCategories }}</strong>
              </article>

              <article class="admin-stat-card">
                <span>Catalog tracks</span>
                <strong>{{ totalTracks }}</strong>
              </article>

              <article class="admin-stat-card">
                <span>Track scope</span>
                <strong>{{ publicTracks }} public</strong>
              </article>
            </div>

            <div class="admin-overview-grid">
              <article class="admin-overview-card">
                <h2>Manage artists</h2>
                <p>Create, edit, and remove official artist references.</p>
                <button
                  type="button"
                  class="button button--secondary button--sm"
                  @click="activeTab = 'artists'"
                >
                  Go to Artists
                </button>
              </article>

              <article class="admin-overview-card">
                <h2>Manage categories</h2>
                <p>Keep category references clean and organized.</p>
                <button
                  type="button"
                  class="button button--secondary button--sm"
                  @click="activeTab = 'categories'"
                >
                  Go to Categories
                </button>
              </article>

              <article class="admin-overview-card">
                <h2>Moderate catalog tracks</h2>
                <p>Review and remove public tracks from the catalog.</p>
                <button
                  type="button"
                  class="button button--secondary button--sm"
                  @click="activeTab = 'tracks'"
                >
                  Go to Tracks
                </button>
              </article>
            </div>

            <div class="admin-simple-card">
              <div>
                <h2>Current backend scope</h2>
                <p>
                  The current admin track list reflects public catalog tracks. A
                  dedicated admin endpoint would be needed to list every private
                  track from every user.
                </p>
              </div>
            </div>
          </section>

          <!-- Artists -->
          <section v-if="activeTab === 'artists'" class="admin-crud-layout">
            <section class="admin-panel">
              <div class="admin-panel__header">
                <h2>{{ isEditingArtist ? "Edit artist" : "Create artist" }}</h2>
                <p>Maintain official artist references for the catalog.</p>
              </div>

              <form class="admin-form" @submit.prevent="saveArtist">
                <div class="admin-form__field">
                  <label for="artist-name">Name</label>
                  <input
                    id="artist-name"
                    v-model="artistForm.name"
                    type="text"
                    placeholder="Artist name"
                  />
                </div>

                <div class="admin-form__field">
                  <label for="artist-image">Image URL</label>
                  <input
                    id="artist-image"
                    v-model="artistForm.imageUrl"
                    type="text"
                    placeholder="https://..."
                  />
                </div>

                <div class="admin-form__field">
                  <label for="artist-description">Description</label>
                  <textarea
                    id="artist-description"
                    v-model="artistForm.description"
                    rows="6"
                    placeholder="Artist description"
                  ></textarea>
                </div>

                <div class="admin-form__actions">
                  <button
                    type="button"
                    class="button button--ghost"
                    @click="resetArtistForm"
                  >
                    Clear
                  </button>

                  <button type="submit" class="button button--primary">
                    {{ isEditingArtist ? "Save changes" : "Create artist" }}
                  </button>
                </div>
              </form>
            </section>

            <section class="admin-panel">
              <div class="admin-panel__header">
                <h2>Artists</h2>
                <p>Search, edit, and remove official artists.</p>
              </div>

              <div class="admin-searchbar">
                <input
                  v-model="artistSearch"
                  type="text"
                  placeholder="Search artists..."
                />
              </div>

              <div v-if="filteredArtists.length" class="admin-item-list">
                <article
                  v-for="artist in filteredArtists"
                  :key="artist.id"
                  class="admin-item-card"
                >
                  <div
                    class="admin-item-card__cover"
                    :style="getCoverStyle(artist.imageUrl)"
                  ></div>

                  <div class="admin-item-card__body">
                    <h3>{{ artist.name }}</h3>
                    <p>
                      {{ artist.description || "No description provided yet." }}
                    </p>

                    <div class="admin-item-card__actions">
                      <button
                        type="button"
                        class="button button--details button--sm"
                        @click="editArtist(artist)"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        class="button button--danger button--sm"
                        @click="deleteArtist(artist.id, artist.name)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              <div v-else class="admin-empty-state">
                <p>No artists match your search.</p>
              </div>
            </section>
          </section>

          <!-- Categories -->
          <section v-if="activeTab === 'categories'" class="admin-crud-layout">
            <section class="admin-panel">
              <div class="admin-panel__header">
                <h2>
                  {{ isEditingCategory ? "Edit category" : "Create category" }}
                </h2>
                <p>Maintain category references for the catalog.</p>
              </div>

              <form class="admin-form" @submit.prevent="saveCategory">
                <div class="admin-form__field">
                  <label for="category-name">Name</label>
                  <input
                    id="category-name"
                    v-model="categoryForm.name"
                    type="text"
                    placeholder="Category name"
                  />
                </div>

                <div class="admin-form__field">
                  <label for="category-description">Description</label>
                  <textarea
                    id="category-description"
                    v-model="categoryForm.description"
                    rows="6"
                    placeholder="Category description"
                  ></textarea>
                </div>

                <div class="admin-form__actions">
                  <button
                    type="button"
                    class="button button--ghost"
                    @click="resetCategoryForm"
                  >
                    Clear
                  </button>

                  <button type="submit" class="button button--primary">
                    {{ isEditingCategory ? "Save changes" : "Create category" }}
                  </button>
                </div>
              </form>
            </section>

            <section class="admin-panel">
              <div class="admin-panel__header">
                <h2>Categories</h2>
                <p>Search, edit, and remove catalog categories.</p>
              </div>

              <div class="admin-searchbar">
                <input
                  v-model="categorySearch"
                  type="text"
                  placeholder="Search categories..."
                />
              </div>

              <div v-if="filteredCategories.length" class="admin-simple-list">
                <article
                  v-for="category in filteredCategories"
                  :key="category.id"
                  class="admin-simple-card"
                >
                  <div>
                    <h3>{{ category.name }}</h3>
                    <p>
                      {{
                        category.description || "No description provided yet."
                      }}
                    </p>
                  </div>

                  <div class="admin-simple-card__actions">
                    <button
                      type="button"
                      class="button button--details button--sm"
                      @click="editCategory(category)"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      class="button button--danger button--sm"
                      @click="deleteCategory(category.id, category.name)"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              </div>

              <div v-else class="admin-empty-state">
                <p>No categories match your search.</p>
              </div>
            </section>
          </section>

          <!-- Tracks -->
          <section v-if="activeTab === 'tracks'" class="admin-panel">
            <div class="admin-panel__header">
              <h2>Catalog tracks</h2>
              <p>
                Current backend scope: public tracks returned by
                <code>/tracks</code>.
              </p>
            </div>

            <div class="admin-searchbar">
              <input
                v-model="trackSearch"
                type="text"
                placeholder="Search tracks, artist, category, owner..."
              />
            </div>

            <div v-if="filteredTracks.length" class="admin-track-list">
              <article
                v-for="track in filteredTracks"
                :key="track.id"
                class="admin-track-row"
              >
                <div
                  class="admin-track-row__cover"
                  :style="getCoverStyle(track.coverUrl)"
                ></div>

                <div class="admin-track-row__main">
                  <h3>{{ track.title }}</h3>
                  <p>{{ track.artist }} · {{ track.category }}</p>
                </div>

                <div class="admin-track-row__owner">
                  <span>Owner</span>
                  <strong>{{ track.owner }}</strong>
                </div>

                <div class="admin-track-row__status">
                  <span class="admin-track-row__badge">
                    {{ track.isPublic ? "Public" : "Private" }}
                  </span>
                </div>

                <div class="admin-track-row__actions">
                  <RouterLink
                    :to="{ name: 'track-detail', params: { id: track.id } }"
                    class="button button--details button--sm"
                  >
                    Details
                  </RouterLink>

                  <button
                    type="button"
                    class="button button--danger button--sm"
                    @click="deleteTrack(track.id, track.title)"
                  >
                    Delete
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="admin-empty-state">
              <p>No catalog tracks match your search.</p>
            </div>
          </section>
        </template>
      </div>
    </section>
  </section>
</template>
