<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const artistId = Number(route.params.id);

const artistsMap = {
  1: {
    id: 1,
    name: "Twin Tribes",
    genres: "Darkwave · Post-Punk",
    country: "United States",
    activeSince: "2017",
    tracksCount: 12,
    followersLabel: "Favorite by 84 users",
    coverVariant: "violet",
    description:
      "Twin Tribes is a darkwave duo known for sharp synth lines, melancholic vocals, and a polished nocturnal aesthetic. Their sound blends post-punk tension with modern production, creating tracks that feel both romantic and cold.",
    notes:
      "Their strongest material tends to balance melodic immediacy with atmosphere. They fit especially well in darkwave, goth, and late-night synth-driven playlists.",
    topTracks: [
      {
        id: 1,
        title: "Monolith",
        category: "Darkwave",
        rating: "4.8",
      },
      {
        id: 2,
        title: "Ritual",
        category: "Goth Rock",
        rating: "4.6",
      },
      {
        id: 11,
        title: "Shadows",
        category: "Darkwave",
        rating: "4.5",
      },
    ],
  },
  2: {
    id: 2,
    name: "She Past Away",
    genres: "Goth Rock · Darkwave",
    country: "Türkiye",
    activeSince: "2006",
    tracksCount: 9,
    followersLabel: "Favorite by 67 users",
    coverVariant: "sand",
    description:
      "She Past Away is a Turkish duo blending gothic rock textures, post-punk rhythm, and hypnotic vocal delivery. Their music carries a ritualistic and brooding energy with a distinct identity.",
    notes:
      "The project stands out through its mood consistency, strong bass lines, and the particular tension created by its language, pacing, and minimalist repetition.",
    topTracks: [
      {
        id: 3,
        title: "Kasvetli Kutlama",
        category: "Goth Rock",
        rating: "4.9",
      },
      {
        id: 12,
        title: "Durdu Dünya",
        category: "Darkwave",
        rating: "4.7",
      },
      {
        id: 13,
        title: "Ruh",
        category: "Goth Rock",
        rating: "4.5",
      },
    ],
  },
  3: {
    id: 3,
    name: "Molchat Doma",
    genres: "Post-Punk · New Wave",
    country: "Belarus",
    activeSince: "2017",
    tracksCount: 7,
    followersLabel: "Favorite by 93 users",
    coverVariant: "blue",
    description:
      "Molchat Doma is a Belarusian band known for stark post-punk arrangements, cold synth tones, and a restrained, urban melancholy. Their style feels minimal, severe, and immediately recognizable.",
    notes:
      "They work extremely well for playlists centered on cold wave, restrained synths, and bleak city-night atmosphere. The emotional tone is dry, distant, and memorable.",
    topTracks: [
      {
        id: 4,
        title: "Sudno",
        category: "Post-Punk",
        rating: "4.7",
      },
      {
        id: 14,
        title: "Kletka",
        category: "New Wave",
        rating: "4.6",
      },
      {
        id: 15,
        title: "Toska",
        category: "Post-Punk",
        rating: "4.5",
      },
    ],
  },
};

const fallbackArtist = {
  id: artistId,
  name: "Artist not found",
  genres: "Unknown",
  country: "Unknown",
  activeSince: "-",
  tracksCount: 0,
  followersLabel: "No data",
  coverVariant: "stone",
  description:
    "This artist could not be loaded. The backend connection will be added next.",
  notes:
    "No additional information is available for this artist at the moment.",
  topTracks: [],
};

const artist = computed(() => artistsMap[artistId] || fallbackArtist);
const isFavorite = ref(true);

function toggleFavorite() {
  isFavorite.value = !isFavorite.value;
}
</script>

<template>
  <section class="artist-detail-page">
    <div class="container">
      <RouterLink to="/artists" class="artist-detail-back-link">
        ← Back to Artists
      </RouterLink>

      <section class="artist-detail-hero">
        <div
          class="artist-detail-hero__cover"
          :class="`artist-detail-hero__cover--${artist.coverVariant}`"
        >
          <div class="artist-detail-hero__monogram">
            {{ artist.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="artist-detail-hero__content">
          <p class="artist-detail-eyebrow">{{ artist.genres }}</p>

          <h1>{{ artist.name }}</h1>

          <p class="artist-detail-description">
            {{ artist.description }}
          </p>

          <div class="artist-detail-stats">
            <span>{{ artist.country }}</span>
            <span>Active since {{ artist.activeSince }}</span>
            <span>{{ artist.tracksCount }} tracks</span>
            <span>{{ artist.followersLabel }}</span>
          </div>

          <div class="artist-detail-actions">
            <button
              type="button"
              class="button button--ghost"
              @click="toggleFavorite"
            >
              {{ isFavorite ? "♥ Favorited" : "♡ Add to favorites" }}
            </button>
          </div>
        </div>
      </section>

      <div class="artist-detail-layout">
        <section class="artist-detail-panel">
          <div class="artist-detail-panel__header">
            <h2>Artist profile</h2>
          </div>

          <p class="artist-detail-panel__text">
            {{ artist.notes }}
          </p>
        </section>

        <section class="artist-detail-panel">
          <div class="artist-detail-panel__header">
            <h2>Quick facts</h2>
          </div>

          <div class="artist-facts-list">
            <div class="artist-facts-list__item">
              <span>Genres</span>
              <strong>{{ artist.genres }}</strong>
            </div>

            <div class="artist-facts-list__item">
              <span>Country</span>
              <strong>{{ artist.country }}</strong>
            </div>

            <div class="artist-facts-list__item">
              <span>Active since</span>
              <strong>{{ artist.activeSince }}</strong>
            </div>

            <div class="artist-facts-list__item">
              <span>Tracks in catalog</span>
              <strong>{{ artist.tracksCount }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section class="artist-detail-panel artist-tracks-panel">
        <div class="artist-detail-panel__header">
          <h2>Tracks by this artist</h2>
        </div>

        <div v-if="artist.topTracks.length" class="artist-track-list">
          <article
            v-for="track in artist.topTracks"
            :key="track.id"
            class="artist-track-row"
          >
            <div class="artist-track-row__cover"></div>

            <div class="artist-track-row__main">
              <h3>{{ track.title }}</h3>
              <p>{{ track.category }}</p>
            </div>

            <div class="artist-track-row__rating">
              <span class="stars">★★★★★</span>
              <span>{{ track.rating }}</span>
            </div>

            <RouterLink
              :to="`/tracks/${track.id}`"
              class="button button--details button--sm"
            >
              Details
            </RouterLink>
          </article>
        </div>

        <div v-else class="artist-detail-empty-state">
          <p>No tracks available for this artist yet.</p>
        </div>
      </section>
    </div>
  </section>
</template>
