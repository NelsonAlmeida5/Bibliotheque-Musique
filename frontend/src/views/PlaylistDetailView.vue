<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const playlistId = Number(route.params.id);

const mockPlaylists = {
  1: {
    id: 1,
    name: "Late Night Descent",
    description:
      "Dark ambient and drone — for the hours when the city finally goes quiet and the mind starts to wander somewhere deeper.",
    visibility: "Public",
    updatedAgo: "2d ago",
    tracks: [
      {
        id: 101,
        title: "Monolith",
        artist: "Twin Tribes",
        category: "Darkwave",
      },
      {
        id: 102,
        title: "Sudno",
        artist: "Molchat Doma",
        category: "Post-Punk",
      },
      {
        id: 103,
        title: "The Pale Cathedral",
        artist: "Lustmord",
        category: "Industrial",
      },
    ],
  },
  2: {
    id: 2,
    name: "Reverb & Dust",
    description:
      "Shoegaze, dream pop and noise rock — guitars drowning in effects pedals, vocals buried like whispers under static.",
    visibility: "Public",
    updatedAgo: "5d ago",
    tracks: [
      {
        id: 201,
        title: "Tower of Memories",
        artist: "ivri",
        category: "Shoegaze",
      },
      {
        id: 202,
        title: "Ashen Meridian",
        artist: "Coil",
        category: "Post-Industrial",
      },
    ],
  },
  3: {
    id: 3,
    name: "Brazilian Underground",
    description:
      "Luckhaos, trap absurde et autres curiosités brésiliennes — une catégorie à part entière, assumée et sans excuses.",
    visibility: "Private",
    updatedAgo: "1w ago",
    tracks: [
      {
        id: 301,
        title: "União Fiasco",
        artist: "Luckhaos",
        category: "Brazilian Underground",
      },
    ],
  },
  4: {
    id: 4,
    name: "Liturgy & Ruin",
    description:
      "Neoclassical, sacred and post-classical music — compositions that feel like the inside of an empty cathedral at 3am.",
    visibility: "Public",
    updatedAgo: "2w ago",
    tracks: [
      {
        id: 401,
        title: "Pale Empress",
        artist: "Zola Jesus",
        category: "Neoclassical",
      },
      {
        id: 402,
        title: "The Crimson Veil",
        artist: "Bauhaus",
        category: "Gothic Rock",
      },
    ],
  },
  5: {
    id: 5,
    name: "Work & Focus",
    description:
      "Ambient and minimal electronic — no lyrics, no drama. Just texture and rhythm for long sessions of deep work.",
    visibility: "Private",
    updatedAgo: "3w ago",
    tracks: [
      {
        id: 501,
        title: "Drift Into Darkness",
        artist: "Sxmpra",
        category: "Phonk",
      },
      {
        id: 502,
        title: "Angels Ignore Me",
        artist: "DollWave",
        category: "Darkwave",
      },
    ],
  },
};

const fallbackPlaylist = {
  id: playlistId,
  name: "Playlist not found",
  description: "This playlist could not be loaded.",
  visibility: "Private",
  updatedAgo: "-",
  tracks: [],
};

const initialPlaylist = mockPlaylists[playlistId] || fallbackPlaylist;

const playlistName = ref(initialPlaylist.name);
const playlistDescription = ref(initialPlaylist.description);
const playlistVisibility = ref(initialPlaylist.visibility);
const tracks = ref([...initialPlaylist.tracks]);

const trackCount = computed(() => tracks.value.length);

function goBack() {
  router.push("/my-playlists");
}

function removeTrack(trackId) {
  tracks.value = tracks.value.filter((track) => track.id !== trackId);
}

function saveChanges() {
  window.alert("Playlist changes will be connected to the backend next.");
}

function goToCatalog() {
  router.push("/tracks");
}

function deletePlaylist() {
  const confirmed = window.confirm(
    `Delete "${playlistName.value}" permanently?`,
  );

  if (!confirmed) return;

  window.alert("Playlist deletion will be connected to the backend next.");
  router.push("/my-playlists");
}
</script>

<template>
  <section class="playlist-detail-page">
    <div class="container">
      <button type="button" class="playlist-back-link" @click="goBack">
        ← Back to My Playlists
      </button>

      <section class="playlist-detail-hero">
        <div class="playlist-detail-hero__left">
          <h1>Customize playlist</h1>

          <p class="playlist-detail-current-name">
            Editing: <span>{{ playlistName }}</span>
          </p>

          <p class="playlist-detail-subtitle">
            Update the playlist information, manage its tracks, and control its
            visibility.
          </p>

          <div class="playlist-detail-stats">
            <span>{{ trackCount }} tracks</span>
            <span>Updated {{ initialPlaylist.updatedAgo }}</span>
            <span>{{ playlistVisibility }}</span>
          </div>
        </div>

        <div class="playlist-detail-hero__right">
          <button
            type="button"
            class="button button--primary"
            @click="saveChanges"
          >
            Save changes
          </button>
        </div>
      </section>

      <div class="playlist-detail-layout">
        <section class="playlist-detail-panel">
          <h2>Playlist info</h2>

          <div class="playlist-form">
            <div class="playlist-form__field">
              <label for="playlist-name">Name</label>
              <input
                id="playlist-name"
                v-model="playlistName"
                type="text"
                placeholder="Playlist name"
              />
            </div>

            <div class="playlist-form__field">
              <label for="playlist-description">Description</label>
              <textarea
                id="playlist-description"
                v-model="playlistDescription"
                rows="5"
                placeholder="Describe this playlist"
              ></textarea>
            </div>

            <div class="playlist-form__field">
              <label for="playlist-visibility">Visibility</label>
              <select id="playlist-visibility" v-model="playlistVisibility">
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>
          </div>
        </section>

        <section class="playlist-detail-panel">
          <div class="playlist-detail-panel__header">
            <div class="playlist-detail-panel__title-group">
              <h2>Tracks in this playlist</h2>
              <span>{{ trackCount }} total</span>
            </div>

            <button
              type="button"
              class="button button--secondary button--sm"
              @click="goToCatalog"
            >
              Add tracks
            </button>
          </div>

          <div v-if="tracks.length" class="playlist-track-list">
            <article
              v-for="track in tracks"
              :key="track.id"
              class="playlist-track-row"
            >
              <div class="playlist-track-row__cover"></div>

              <div class="playlist-track-row__main">
                <h3>{{ track.title }}</h3>
                <p>{{ track.artist }}</p>
              </div>

              <div class="playlist-track-row__category">
                {{ track.category }}
              </div>

              <button
                type="button"
                class="button button--details button--sm"
                @click="removeTrack(track.id)"
              >
                Remove
              </button>
            </article>
          </div>

          <div v-else class="playlist-empty-state">
            <p>This playlist is empty.</p>
            <button
              type="button"
              class="button button--secondary"
              @click="goToCatalog"
            >
              Browse Catalog
            </button>
          </div>
        </section>
      </div>

      <section class="playlist-delete-panel">
        <div>
          <h2>Delete playlist</h2>
          <p>This action is permanent and cannot be undone.</p>
        </div>

        <button
          type="button"
          class="button button--danger"
          @click="deletePlaylist"
        >
          Delete playlist
        </button>
      </section>
    </div>
  </section>
</template>
