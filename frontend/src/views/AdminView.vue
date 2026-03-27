<script setup>
import { computed, ref } from "vue";

const activeTab = ref("overview");

/* -------------------- Search -------------------- */
const artistSearch = ref("");
const categorySearch = ref("");
const trackSearch = ref("");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/* -------------------- Artists -------------------- */
const artists = ref([
  {
    id: 1,
    name: "Twin Tribes",
    imageUrl: "https://picsum.photos/seed/adminartist1/300/300",
    description:
      "Darkwave duo with sharp synth lines and nocturnal atmosphere.",
  },
  {
    id: 2,
    name: "She Past Away",
    imageUrl: "https://picsum.photos/seed/adminartist2/300/300",
    description: "Gothic rock / darkwave duo with hypnotic rhythms.",
  },
]);

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
const categories = ref([
  {
    id: 1,
    name: "Darkwave",
    description: "Cold synth-driven atmosphere with melancholic textures.",
  },
  {
    id: 2,
    name: "Goth Rock",
    description: "Gothic rock with darker post-punk influence.",
  },
]);

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
const tracks = ref([
  {
    id: 1,
    title: "Monolith",
    artist: "Twin Tribes",
    category: "Darkwave",
    owner: "admin",
    isPublic: true,
  },
  {
    id: 2,
    title: "Kasvetli Kutlama",
    artist: "She Past Away",
    category: "Goth Rock",
    owner: "admin",
    isPublic: true,
  },
  {
    id: 3,
    title: "After the Static",
    artist: "Nyght Ritual",
    category: "Night Industrial",
    owner: "testfrontend",
    isPublic: false,
  },
]);

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
const privateTracks = computed(
  () => tracks.value.filter((track) => !track.isPublic).length,
);

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
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveArtist() {
  if (!artistForm.value.name.trim()) {
    window.alert("Artist name is required.");
    return;
  }

  if (isEditingArtist.value) {
    const index = artists.value.findIndex(
      (artist) => artist.id === artistForm.value.id,
    );
    if (index !== -1) {
      artists.value[index] = {
        ...artists.value[index],
        name: artistForm.value.name.trim(),
        imageUrl: artistForm.value.imageUrl.trim(),
        description: artistForm.value.description.trim(),
      };
    }
    window.alert("Artist updated. Backend connection comes next.");
  } else {
    artists.value.unshift({
      id: Date.now(),
      name: artistForm.value.name.trim(),
      imageUrl: artistForm.value.imageUrl.trim(),
      description: artistForm.value.description.trim(),
    });
    window.alert("Artist created. Backend connection comes next.");
  }

  resetArtistForm();
}

function deleteArtist(id, name) {
  const confirmed = window.confirm(`Delete artist "${name}" permanently?`);
  if (!confirmed) return;

  artists.value = artists.value.filter((artist) => artist.id !== id);

  if (artistForm.value.id === id) {
    resetArtistForm();
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
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveCategory() {
  if (!categoryForm.value.name.trim()) {
    window.alert("Category name is required.");
    return;
  }

  if (isEditingCategory.value) {
    const index = categories.value.findIndex(
      (category) => category.id === categoryForm.value.id,
    );
    if (index !== -1) {
      categories.value[index] = {
        ...categories.value[index],
        name: categoryForm.value.name.trim(),
        description: categoryForm.value.description.trim(),
      };
    }
    window.alert("Category updated. Backend connection comes next.");
  } else {
    categories.value.unshift({
      id: Date.now(),
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim(),
    });
    window.alert("Category created. Backend connection comes next.");
  }

  resetCategoryForm();
}

function deleteCategory(id, name) {
  const confirmed = window.confirm(`Delete category "${name}" permanently?`);
  if (!confirmed) return;

  categories.value = categories.value.filter((category) => category.id !== id);

  if (categoryForm.value.id === id) {
    resetCategoryForm();
  }
}

/* -------------------- Track actions -------------------- */
function editTrack(track) {
  window.alert(`Track editing for "${track.title}" will be connected next.`);
}

function deleteTrack(id, title) {
  const confirmed = window.confirm(`Delete track "${title}" permanently?`);
  if (!confirmed) return;

  tracks.value = tracks.value.filter((track) => track.id !== id);
}
</script>

<template>
  <section class="admin-page">
    <section class="admin-topbar">
      <div class="container admin-topbar__inner">
        <div class="admin-heading">
          <h1>Admin Panel</h1>
          <p>Manage artists, categories, and track moderation.</p>
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
              <span>Total tracks</span>
              <strong>{{ totalTracks }}</strong>
            </article>

            <article class="admin-stat-card">
              <span>Public / Private</span>
              <strong>{{ publicTracks }} / {{ privateTracks }}</strong>
            </article>
          </div>

          <div class="admin-overview-grid">
            <article class="admin-overview-card">
              <h2>Manage artists</h2>
              <p>
                Create, edit, and remove artists from the catalog structure.
              </p>
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
              <p>Keep genre/category references clean and organized.</p>
              <button
                type="button"
                class="button button--secondary button--sm"
                @click="activeTab = 'categories'"
              >
                Go to Categories
              </button>
            </article>

            <article class="admin-overview-card">
              <h2>Moderate tracks</h2>
              <p>
                Review tracks, check ownership, and remove unwanted entries.
              </p>
              <button
                type="button"
                class="button button--secondary button--sm"
                @click="activeTab = 'tracks'"
              >
                Go to Tracks
              </button>
            </article>
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
                  rows="5"
                  placeholder="Describe this artist"
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
              <h2>Artist list</h2>
              <p>Current artists available in the catalog.</p>
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
                  :style="
                    artist.imageUrl
                      ? `background-image: url('${artist.imageUrl}')`
                      : ''
                  "
                ></div>

                <div class="admin-item-card__body">
                  <h3>{{ artist.name }}</h3>
                  <p>{{ artist.description || "No description provided." }}</p>

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
              <p>Maintain official category references for the catalog.</p>
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
                  rows="5"
                  placeholder="Describe this category"
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
              <h2>Category list</h2>
              <p>Current categories available in the catalog.</p>
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
                    {{ category.description || "No description provided." }}
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
            <h2>Track moderation</h2>
            <p>
              Review track ownership, status, and remove tracks when needed.
            </p>
          </div>

          <div class="admin-searchbar">
            <input
              v-model="trackSearch"
              type="text"
              placeholder="Search tracks, artists, categories, owner..."
            />
          </div>

          <div v-if="filteredTracks.length" class="admin-track-list">
            <article
              v-for="track in filteredTracks"
              :key="track.id"
              class="admin-track-row"
            >
              <div class="admin-track-row__cover"></div>

              <div class="admin-track-row__main">
                <h3>{{ track.title }}</h3>
                <p>{{ track.artist }} · {{ track.category }}</p>
              </div>

              <div class="admin-track-row__owner">
                <span>Owner</span>
                <strong>{{ track.owner }}</strong>
              </div>

              <div class="admin-track-row__status">
                <span
                  class="admin-track-row__badge"
                  :class="{ 'is-private': !track.isPublic }"
                >
                  {{ track.isPublic ? "Public" : "Private" }}
                </span>
              </div>

              <div class="admin-track-row__actions">
                <button
                  type="button"
                  class="button button--details button--sm"
                  @click="editTrack(track)"
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
            </article>
          </div>

          <div v-else class="admin-empty-state">
            <p>No tracks match your search.</p>
          </div>
        </section>
      </div>
    </section>
  </section>
</template>
