<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const playlists = ref([
  {
    id: 1,
    name: "Late Night Descent",
    description:
      "Dark ambient and drone — for the hours when the city finally goes quiet and the mind starts to wander somewhere deeper.",
    tracksCount: 18,
    updatedAgo: "2d ago",
    variant: "sand",
  },
  {
    id: 2,
    name: "Reverb & Dust",
    description:
      "Shoegaze, dream pop and noise rock — guitars drowning in effects pedals, vocals buried like whispers under static.",
    tracksCount: 22,
    updatedAgo: "5d ago",
    variant: "violet",
  },
  {
    id: 3,
    name: "Brazilian Underground",
    description:
      "Luckhaos, trap absurde et autres curiosités brésiliennes — une catégorie à part entière, assumée et sans excuses.",
    tracksCount: 9,
    updatedAgo: "1w ago",
    variant: "sand",
  },
  {
    id: 4,
    name: "Liturgy & Ruin",
    description:
      "Neoclassical, sacred and post-classical music — compositions that feel like the inside of an empty cathedral at 3am.",
    tracksCount: 15,
    updatedAgo: "2w ago",
    variant: "blue",
  },
  {
    id: 5,
    name: "Work & Focus",
    description:
      "Ambient and minimal electronic — no lyrics, no drama. Just texture and rhythm for long sessions of deep work.",
    tracksCount: 11,
    updatedAgo: "3w ago",
    variant: "stone",
  },
]);

const playlistCount = computed(() => playlists.value.length);
const totalTracks = computed(() =>
  playlists.value.reduce((sum, playlist) => sum + playlist.tracksCount, 0),
);

function openPlaylist(id) {
  router.push(`/my-playlists/${id}`);
}

function deletePlaylist(id, name) {
  const confirmed = window.confirm(`Delete "${name}" permanently?`);

  if (!confirmed) return;

  playlists.value = playlists.value.filter((playlist) => playlist.id !== id);
}

function createPlaylist() {
  window.alert("Playlist creation form will be added next.");
}
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
        <div class="my-playlists-grid">
          <button
            type="button"
            class="playlist-create-card"
            @click="createPlaylist"
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
            <div
              class="playlist-card__cover"
              :class="`playlist-card__cover--${playlist.variant}`"
            >
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

              <div class="playlist-card__cover-grid">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <div class="playlist-card__body">
              <h3>{{ playlist.name }}</h3>
              <p class="playlist-card__description">
                {{ playlist.description }}
              </p>

              <div class="playlist-card__meta">
                <span>{{ playlist.tracksCount }} tracks</span>
                <span>Updated {{ playlist.updatedAgo }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>
