<script setup>
import { computed, ref } from "vue";

const artistOptions = [
  { id: 1, name: "Twin Tribes" },
  { id: 2, name: "She Past Away" },
  { id: 3, name: "Molchat Doma" },
  { id: 4, name: "Lustmord" },
  { id: 5, name: "ivri" },
];

const categoryOptions = [
  { id: 1, name: "Darkwave" },
  { id: 2, name: "Goth Rock" },
  { id: 3, name: "Post-Punk" },
  { id: 4, name: "Shoegaze" },
  { id: 5, name: "Industrial" },
];

const tracks = ref([
  {
    id: 1,
    title: "After the Static",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    coverUrl: "https://picsum.photos/seed/track1/500/500",
    description:
      "A private draft track meant for one of my late-night playlists.",
    artistId: 1,
    categoryId: 1,
    customArtistName: null,
    customCategoryName: null,
    isPublic: false,
  },
  {
    id: 2,
    title: "Dust Chapel",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    coverUrl: "https://picsum.photos/seed/track2/500/500",
    description:
      "Industrial textures and darker ambient layers for personal use.",
    artistId: null,
    categoryId: null,
    customArtistName: "Nyght Ritual",
    customCategoryName: "Night Industrial",
    isPublic: false,
  },
]);

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

function getArtistName(artistId) {
  return (
    artistOptions.find((artist) => artist.id === artistId)?.name ||
    "Unknown artist"
  );
}

function getCategoryName(categoryId) {
  return (
    categoryOptions.find((category) => category.id === categoryId)?.name ||
    "Unknown category"
  );
}

function getTrackArtistLabel(track) {
  if (track.customArtistName) return track.customArtistName;
  if (track.artistId) return getArtistName(track.artistId);
  return "Unspecified artist";
}

function getTrackCategoryLabel(track) {
  if (track.customCategoryName) return track.customCategoryName;
  if (track.categoryId) return getCategoryName(track.categoryId);
  return "Unspecified category";
}

const filteredArtistOptions = computed(() => {
  const search = normalize(form.value.artistInput);
  if (!search) return artistOptions;

  return artistOptions.filter((artist) =>
    normalize(artist.name).includes(search),
  );
});

const filteredCategoryOptions = computed(() => {
  const search = normalize(form.value.categoryInput);
  if (!search) return categoryOptions;

  return categoryOptions.filter((category) =>
    normalize(category.name).includes(search),
  );
});

function findExactArtistMatch(input) {
  return (
    artistOptions.find(
      (artist) => normalize(artist.name) === normalize(input),
    ) || null
  );
}

function findExactCategoryMatch(input) {
  return (
    categoryOptions.find(
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
}

function loadTrackIntoForm(track) {
  form.value = {
    id: track.id,
    title: track.title,
    embedUrl: track.embedUrl,
    coverUrl: track.coverUrl,
    description: track.description,
    artistInput: track.customArtistName || getArtistName(track.artistId),
    categoryInput:
      track.customCategoryName || getCategoryName(track.categoryId),
    selectedArtistId: track.artistId ?? null,
    selectedCategoryId: track.categoryId ?? null,
  };

  showArtistSuggestions.value = false;
  showCategorySuggestions.value = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTrack(trackId, title) {
  const confirmed = window.confirm(`Delete "${title}" permanently?`);

  if (!confirmed) return;

  tracks.value = tracks.value.filter((track) => track.id !== trackId);

  if (form.value.id === trackId) {
    resetForm();
  }
}

function buildArtistPayload() {
  const exactMatch = findExactArtistMatch(form.value.artistInput);

  if (exactMatch) {
    return {
      artistId: exactMatch.id,
      customArtistName: null,
    };
  }

  if (form.value.selectedArtistId) {
    return {
      artistId: form.value.selectedArtistId,
      customArtistName: null,
    };
  }

  return {
    artistId: null,
    customArtistName: form.value.artistInput.trim(),
  };
}

function buildCategoryPayload() {
  const exactMatch = findExactCategoryMatch(form.value.categoryInput);

  if (exactMatch) {
    return {
      categoryId: exactMatch.id,
      customCategoryName: null,
    };
  }

  if (form.value.selectedCategoryId) {
    return {
      categoryId: form.value.selectedCategoryId,
      customCategoryName: null,
    };
  }

  return {
    categoryId: null,
    customCategoryName: form.value.categoryInput.trim(),
  };
}

function handleSubmit() {
  if (
    !form.value.title.trim() ||
    !form.value.embedUrl.trim() ||
    !form.value.artistInput.trim() ||
    !form.value.categoryInput.trim()
  ) {
    window.alert("Please fill in the required fields.");
    return;
  }

  const artistPayload = buildArtistPayload();
  const categoryPayload = buildCategoryPayload();

  const payload = {
    title: form.value.title.trim(),
    embedUrl: form.value.embedUrl.trim(),
    coverUrl: form.value.coverUrl.trim(),
    description: form.value.description.trim(),
    artistId: artistPayload.artistId,
    categoryId: categoryPayload.categoryId,
    customArtistName: artistPayload.customArtistName,
    customCategoryName: categoryPayload.customCategoryName,
    isPublic: false,
  };

  if (isEditing.value) {
    const index = tracks.value.findIndex((track) => track.id === form.value.id);

    if (index !== -1) {
      tracks.value[index] = {
        ...tracks.value[index],
        ...payload,
      };
    }

    window.alert("Track updated. Backend connection comes next.");
  } else {
    tracks.value.unshift({
      id: Date.now(),
      ...payload,
    });

    window.alert("Private track created. Backend connection comes next.");
  }

  resetForm();
}
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
              <label for="track-embed-url">Embed URL</label>
              <input
                id="track-embed-url"
                v-model="form.embedUrl"
                type="text"
                placeholder="https://www.youtube.com/embed/..."
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
              If a matching artist or category already exists, you can select
              it. Otherwise, your typed value will be saved as custom.
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

                <button type="submit" class="button button--primary">
                  {{ isEditing ? "Save changes" : "Create track" }}
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
                Edit or remove the tracks that belong to your personal library.
              </p>
            </div>
          </div>

          <div v-if="tracks.length" class="my-track-list">
            <article
              v-for="track in tracks"
              :key="track.id"
              class="my-track-card"
            >
              <div
                class="my-track-card__cover"
                :style="
                  track.coverUrl
                    ? `background-image: url('${track.coverUrl}')`
                    : ''
                "
              ></div>

              <div class="my-track-card__body">
                <div class="my-track-card__top">
                  <div>
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
                  <span>Embed ready</span>
                  <span>Owner track</span>
                </div>

                <div class="my-track-card__actions">
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
