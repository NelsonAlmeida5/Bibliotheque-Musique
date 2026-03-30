<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const playlists = ref([]);

const isLoading = ref(true);
const isSubmittingCreate = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const showCreateForm = ref(false);

const createForm = ref({
  name: "",
  description: "",
});

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

function toTimestamp(dateValue) {
  if (!dateValue) return 0;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;

  return date.getTime();
}

function normalizeTrack(item) {
  return {
    id: item.id,
    coverUrl: item.coverUrl ?? item.cover_url ?? "",
    createdAt: item.createdAt ?? item.created_at ?? null,
  };
}

function buildCoverTracks(tracks) {
  return [...tracks]
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, 4);
}

function normalizePlaylist(item) {
  const normalizedTracks = Array.isArray(item.tracks)
    ? item.tracks.map(normalizeTrack)
    : [];

  return {
    id: item.id,
    name: item.name ?? "Untitled playlist",
    description: item.description ?? "",
    updatedAt:
      item.updatedAt ??
      item.updated_at ??
      item.createdAt ??
      item.created_at ??
      null,
    tracks: normalizedTracks,
    tracksCount: normalizedTracks.length,
    coverTracks: buildCoverTracks(normalizedTracks),
  };
}

function getTrackTileStyle(track) {
  if (!track?.coverUrl) return {};

  return {
    backgroundImage: `linear-gradient(135deg, rgba(127, 120, 226, 0.16), rgba(98, 51, 129, 0.22)), url("${track.coverUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function formatUpdatedLabel(dateValue) {
  if (!dateValue) return "Recently updated";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const playlistCount = computed(() => playlists.value.length);
const totalTracks = computed(() =>
  playlists.value.reduce((sum, playlist) => sum + playlist.tracksCount, 0),
);

async function loadPlaylists() {
  isLoading.value = true;
  clearFeedback();

  try {
    const response = await api.get("/my-playlists");
    playlists.value = extractCollection(response.data).map(normalizePlaylist);
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to load your playlists right now.",
    );
  } finally {
    isLoading.value = false;
  }
}

function openPlaylist(id) {
  router.push({ name: "playlist-detail", params: { id } });
}

function openCreateForm() {
  clearFeedback();
  showCreateForm.value = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeCreateForm() {
  showCreateForm.value = false;
  createForm.value = {
    name: "",
    description: "",
  };
}

async function createPlaylist() {
  clearFeedback();

  if (!createForm.value.name.trim()) {
    errorMessage.value = "Playlist name is required.";
    return;
  }

  isSubmittingCreate.value = true;

  try {
    const response = await api.post("/my-playlists", {
      name: createForm.value.name.trim(),
      description: createForm.value.description.trim() || null,
    });

    successMessage.value = "Playlist created successfully.";
    closeCreateForm();
    await loadPlaylists();

    const createdId = response.data?.id;
    if (createdId) {
      router.push({ name: "playlist-detail", params: { id: createdId } });
    }
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to create the playlist.",
    );
  } finally {
    isSubmittingCreate.value = false;
  }
}

async function deletePlaylist(id, name) {
  clearFeedback();

  const confirmed = window.confirm(`Delete "${name}" permanently?`);
  if (!confirmed) return;

  try {
    await api.delete(`/my-playlists/${id}`);
    playlists.value = playlists.value.filter((playlist) => playlist.id !== id);
    successMessage.value = "Playlist deleted successfully.";
  } catch (error) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Unable to delete the playlist.",
    );
  }
}

onMounted(() => {
  loadPlaylists();
});
</script>

<template>
  <section class="my-playlists-page">
    <section class="my-playlists-topbar">
      <div class="container my-playlists-topbar__inner">
        <div class="my-playlists-heading">
          <h1>My Playlists</h1>
          <p>{{ playlistCount }} playlists · {{ totalTracks }} tracks total</p>
        </div>
      </div>
    </section>

    <section class="my-playlists-content">
      <div class="container">
        <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth-success">{{ successMessage }}</p>

        <section v-if="showCreateForm" class="playlist-creator-panel">
          <div class="playlist-creator-panel__header">
            <div>
              <h2>Create playlist</h2>
              <p>Build a new private collection for your library.</p>
            </div>
          </div>

          <form class="playlist-creator-form" @submit.prevent="createPlaylist">
            <div class="playlist-form__field">
              <label for="new-playlist-name">Name</label>
              <input
                id="new-playlist-name"
                v-model="createForm.name"
                type="text"
                placeholder="Playlist name"
              />
            </div>

            <div class="playlist-form__field">
              <label for="new-playlist-description">Description</label>
              <textarea
                id="new-playlist-description"
                v-model="createForm.description"
                rows="5"
                placeholder="Describe this playlist"
              ></textarea>
            </div>

            <div class="playlist-creator-form__actions">
              <button
                type="button"
                class="button button--ghost"
                @click="closeCreateForm"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="button button--primary"
                :disabled="isSubmittingCreate"
              >
                {{ isSubmittingCreate ? "Creating..." : "Create playlist" }}
              </button>
            </div>
          </form>
        </section>

        <div v-if="isLoading" class="playlist-page-empty-state">
          <p>Loading your playlists...</p>
        </div>

        <div v-else class="my-playlists-grid">
          <button
            type="button"
            class="playlist-create-card"
            @click="openCreateForm"
          >
            <div class="playlist-create-card__plus">+</div>
            <strong>New playlist</strong>
            <span>Create a new collection</span>
          </button>

          <article
            v-for="playlist in playlists"
            :key="playlist.id"
            class="playlist-card"
            @click="openPlaylist(playlist.id)"
          >
            <div class="playlist-card__cover">
              <div
                class="playlist-card__cover-grid"
                :class="`playlist-card__cover-grid--${playlist.coverTracks.length || 0}`"
              >
                <template v-if="playlist.coverTracks.length">
                  <span
                    v-for="track in playlist.coverTracks"
                    :key="track.id"
                    class="playlist-card__tile"
                    :class="{
                      'playlist-card__tile--placeholder': !track.coverUrl,
                    }"
                    :style="getTrackTileStyle(track)"
                  ></span>
                </template>

                <template v-else>
                  <span
                    v-for="tileIndex in 4"
                    :key="`empty-${tileIndex}`"
                    class="playlist-card__tile playlist-card__tile--placeholder"
                  ></span>
                </template>
              </div>

              <div class="playlist-card__actions">
                <button
                  type="button"
                  class="playlist-card__icon"
                  title="Edit playlist"
                  @click.stop="openPlaylist(playlist.id)"
                >
                  ✎
                </button>

                <button
                  type="button"
                  class="playlist-card__icon"
                  title="Delete playlist"
                  @click.stop="deletePlaylist(playlist.id, playlist.name)"
                >
                  🗑
                </button>
              </div>
            </div>

            <div class="playlist-card__body">
              <h3>{{ playlist.name }}</h3>
              <p class="playlist-card__description">
                {{ playlist.description || "No description provided yet." }}
              </p>

              <div class="playlist-card__meta">
                <span>{{ playlist.tracksCount }} tracks</span>
                <span
                  >Updated {{ formatUpdatedLabel(playlist.updatedAt) }}</span
                >
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>
