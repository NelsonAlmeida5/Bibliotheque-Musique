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
    isPublic: false,
  },
  {
    id: 2,
    title: "Dust Chapel",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    coverUrl: "https://picsum.photos/seed/track2/500/500",
    description:
      "Industrial textures and darker ambient layers for personal use.",
    artistId: 4,
    categoryId: 5,
    isPublic: false,
  },
]);

const form = ref({
  id: null,
  title: "",
  embedUrl: "",
  coverUrl: "",
  description: "",
  artistId: "",
  categoryId: "",
});

const isEditing = computed(() => form.value.id !== null);
const privateTrackCount = computed(() => tracks.value.length);

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

function resetForm() {
  form.value = {
    id: null,
    title: "",
    embedUrl: "",
    coverUrl: "",
    description: "",
    artistId: "",
    categoryId: "",
  };
}

function loadTrackIntoForm(track) {
  form.value = {
    id: track.id,
    title: track.title,
    embedUrl: track.embedUrl,
    coverUrl: track.coverUrl,
    description: track.description,
    artistId: track.artistId,
    categoryId: track.categoryId,
  };

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

function handleSubmit() {
  if (
    !form.value.title ||
    !form.value.embedUrl ||
    !form.value.artistId ||
    !form.value.categoryId
  ) {
    window.alert("Please fill in the required fields.");
    return;
  }

  if (isEditing.value) {
    const index = tracks.value.findIndex((track) => track.id === form.value.id);

    if (index !== -1) {
      tracks.value[index] = {
        ...tracks.value[index],
        title: form.value.title,
        embedUrl: form.value.embedUrl,
        coverUrl: form.value.coverUrl,
        description: form.value.description,
        artistId: Number(form.value.artistId),
        categoryId: Number(form.value.categoryId),
      };
    }

    window.alert("Track updated. Backend connection comes next.");
  } else {
    tracks.value.unshift({
      id: Date.now(),
      title: form.value.title,
      embedUrl: form.value.embedUrl,
      coverUrl: form.value.coverUrl,
      description: form.value.description,
      artistId: Number(form.value.artistId),
      categoryId: Number(form.value.categoryId),
      isPublic: false,
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
                Create or edit a private track. Private tracks do not appear in
                the public catalog.
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
              <div class="track-form__field">
                <label for="track-artist">Artist</label>
                <select id="track-artist" v-model="form.artistId">
                  <option value="" disabled>Select an artist</option>
                  <option
                    v-for="artist in artistOptions"
                    :key="artist.id"
                    :value="artist.id"
                  >
                    {{ artist.name }}
                  </option>
                </select>
              </div>

              <div class="track-form__field">
                <label for="track-category">Category</label>
                <select id="track-category" v-model="form.categoryId">
                  <option value="" disabled>Select a category</option>
                  <option
                    v-for="category in categoryOptions"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>
            </div>

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
                      {{ getArtistName(track.artistId) }} ·
                      {{ getCategoryName(track.categoryId) }}
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
