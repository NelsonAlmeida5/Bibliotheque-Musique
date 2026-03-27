<script setup>
import { computed, ref } from "vue";

const activeTab = ref("all");

const favoriteTracks = ref([
  {
    id: 1,
    title: "Monolith",
    artist: "Twin Tribes",
    category: "Darkwave",
    rating: "4.8",
    coverUrl: "https://picsum.photos/seed/favtrack1/500/500",
  },
  {
    id: 2,
    title: "Kasvetli Kutlama",
    artist: "She Past Away",
    category: "Goth Rock",
    rating: "4.9",
    coverUrl: "https://picsum.photos/seed/favtrack2/500/500",
  },
  {
    id: 3,
    title: "Sudno",
    artist: "Molchat Doma",
    category: "Post-Punk",
    rating: "4.7",
    coverUrl: "https://picsum.photos/seed/favtrack3/500/500",
  },
]);

const favoriteArtists = ref([
  {
    id: 1,
    name: "Twin Tribes",
    genres: "Darkwave · Post-Punk",
    description:
      "Texas darkwave duo known for sharp synth lines, cold melodies, and a polished nocturnal atmosphere.",
    tracksCount: 12,
    coverVariant: "violet",
  },
  {
    id: 2,
    name: "She Past Away",
    genres: "Goth Rock · Darkwave",
    description:
      "Turkish duo blending gothic rock textures with post-punk rhythms and hypnotic vocals.",
    tracksCount: 9,
    coverVariant: "sand",
  },
  {
    id: 3,
    name: "Molchat Doma",
    genres: "Post-Punk · New Wave",
    description:
      "Belarusian band with cold wave energy, minimalist arrangements, and a stark, melancholic identity.",
    tracksCount: 7,
    coverVariant: "blue",
  },
]);

const favoriteTracksCount = computed(() => favoriteTracks.value.length);
const favoriteArtistsCount = computed(() => favoriteArtists.value.length);
const totalFavorites = computed(
  () => favoriteTracks.value.length + favoriteArtists.value.length,
);

function removeFavoriteTrack(trackId, title) {
  const confirmed = window.confirm(`Remove "${title}" from favorite tracks?`);
  if (!confirmed) return;

  favoriteTracks.value = favoriteTracks.value.filter(
    (track) => track.id !== trackId,
  );
}

function removeFavoriteArtist(artistId, name) {
  const confirmed = window.confirm(`Remove "${name}" from favorite artists?`);
  if (!confirmed) return;

  favoriteArtists.value = favoriteArtists.value.filter(
    (artist) => artist.id !== artistId,
  );
}
</script>

<template>
  <section class="favorites-page">
    <section class="favorites-topbar">
      <div class="container favorites-topbar__inner">
        <div class="favorites-heading">
          <h1>Favorites</h1>
          <p>
            {{ totalFavorites }} favorites · {{ favoriteTracksCount }} tracks ·
            {{ favoriteArtistsCount }} artists
          </p>
        </div>

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
    </section>

    <section class="favorites-content">
      <div class="container">
        <section
          v-if="activeTab === 'all' || activeTab === 'tracks'"
          class="favorites-section"
        >
          <div class="favorites-section__header">
            <div>
              <h2>Favorite Tracks</h2>
              <p>The tracks you want to keep close.</p>
            </div>

            <span class="favorites-section__count">{{
              favoriteTracksCount
            }}</span>
          </div>

          <div v-if="favoriteTracks.length" class="favorite-track-grid">
            <article
              v-for="track in favoriteTracks"
              :key="track.id"
              class="favorite-track-card"
            >
              <div
                class="favorite-track-card__cover"
                :style="`background-image: url('${track.coverUrl}')`"
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
                    <span class="stars">★★★★★</span>
                    <span>{{ track.rating }}</span>
                  </div>

                  <RouterLink
                    :to="`/tracks/${track.id}`"
                    class="button button--details button--sm"
                  >
                    Details
                  </RouterLink>
                </div>
              </div>
            </article>
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
          v-if="activeTab === 'all' || activeTab === 'artists'"
          class="favorites-section"
        >
          <div class="favorites-section__header">
            <div>
              <h2>Favorite Artists</h2>
              <p>The artists you keep returning to.</p>
            </div>

            <span class="favorites-section__count">{{
              favoriteArtistsCount
            }}</span>
          </div>

          <div v-if="favoriteArtists.length" class="favorite-artist-grid">
            <article
              v-for="artist in favoriteArtists"
              :key="artist.id"
              class="favorite-artist-card"
            >
              <div
                class="favorite-artist-card__cover"
                :class="`favorite-artist-card__cover--${artist.coverVariant}`"
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
                <p class="favorite-artist-card__genres">{{ artist.genres }}</p>
                <p class="favorite-artist-card__description">
                  {{ artist.description }}
                </p>

                <div class="favorite-artist-card__footer">
                  <span>{{ artist.tracksCount }} tracks</span>

                  <RouterLink
                    :to="`/artists/${artist.id}`"
                    class="button button--details button--sm"
                  >
                    Details
                  </RouterLink>
                </div>
              </div>
            </article>
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
      </div>
    </section>
  </section>
</template>
