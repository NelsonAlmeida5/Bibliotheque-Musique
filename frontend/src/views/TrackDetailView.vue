<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const trackId = Number(route.params.id);

const tracksMap = {
  1: {
    id: 1,
    title: "Monolith",
    artist: {
      id: 1,
      name: "Twin Tribes",
    },
    category: "Darkwave",
    coverUrl: "https://picsum.photos/seed/trackdetail1/800/800",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "A cold and hypnotic darkwave track built around sharp synth lines, melancholic vocals, and a nocturnal atmosphere that feels both intimate and cinematic.",
    averageRating: "4.8",
    ratingsCount: 28,
    comments: [
      {
        id: 1,
        username: "Nyght",
        content:
          "One of the strongest tracks in the whole catalog. Very clean atmosphere.",
        createdAt: "2 days ago",
      },
      {
        id: 2,
        username: "user01",
        content:
          "The synth textures and the vocal delivery work ridiculously well together.",
        createdAt: "5 days ago",
      },
    ],
  },
  2: {
    id: 2,
    title: "Ritual",
    artist: {
      id: 1,
      name: "Twin Tribes",
    },
    category: "Goth Rock",
    coverUrl: "https://picsum.photos/seed/trackdetail2/800/800",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "A more ritualistic and dramatic cut with darker tension, ceremonial pacing, and a thicker wall of atmosphere.",
    averageRating: "4.6",
    ratingsCount: 17,
    comments: [
      {
        id: 1,
        username: "user02",
        content: "Less immediate than Monolith, but the mood is excellent.",
        createdAt: "1 week ago",
      },
    ],
  },
  3: {
    id: 3,
    title: "Kasvetli Kutlama",
    artist: {
      id: 2,
      name: "She Past Away",
    },
    category: "Goth Rock",
    coverUrl: "https://picsum.photos/seed/trackdetail3/800/800",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "A brooding gothic rock track with post-punk pulse, Turkish vocals, and a hypnotic sense of motion.",
    averageRating: "4.9",
    ratingsCount: 34,
    comments: [
      {
        id: 1,
        username: "user03",
        content: "Absolutely iconic. The rhythm section carries so much mood.",
        createdAt: "3 days ago",
      },
    ],
  },
  4: {
    id: 4,
    title: "Sudno",
    artist: {
      id: 3,
      name: "Molchat Doma",
    },
    category: "Post-Punk",
    coverUrl: "https://picsum.photos/seed/trackdetail4/800/800",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "A stark post-punk anthem driven by cold synths, restraint, repetition, and that specific kind of urban melancholy.",
    averageRating: "4.7",
    ratingsCount: 41,
    comments: [
      {
        id: 1,
        username: "user04",
        content: "Minimal, sharp, unforgettable.",
        createdAt: "6 days ago",
      },
    ],
  },
};

const fallbackTrack = {
  id: trackId,
  title: "Track not found",
  artist: {
    id: 1,
    name: "Unknown artist",
  },
  category: "Unknown category",
  coverUrl: "https://picsum.photos/seed/trackfallback/800/800",
  embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  description:
    "This track could not be loaded. The backend connection will be added next.",
  averageRating: "0.0",
  ratingsCount: 0,
  comments: [],
};

const track = computed(() => tracksMap[trackId] || fallbackTrack);

const isFavorite = ref(true);
const selectedRating = ref(0);

function toggleFavorite() {
  isFavorite.value = !isFavorite.value;
}

function setRating(value) {
  selectedRating.value = value;
}

function addToPlaylist() {
  window.alert("Add to playlist flow will be connected next.");
}
</script>

<template>
  <section class="track-detail-page">
    <div class="container">
      <RouterLink to="/tracks" class="track-detail-back-link">
        ← Back to Catalog
      </RouterLink>

      <section class="track-detail-hero">
        <div
          class="track-detail-hero__cover"
          :style="`background-image: url('${track.coverUrl}')`"
        ></div>

        <div class="track-detail-hero__content">
          <p class="track-detail-eyebrow">{{ track.category }}</p>

          <h1>{{ track.title }}</h1>

          <p class="track-detail-artist-line">
            by
            <RouterLink :to="`/artists/${track.artist.id}`">
              {{ track.artist.name }}
            </RouterLink>
          </p>

          <p class="track-detail-description">
            {{ track.description }}
          </p>

          <div class="track-detail-stats">
            <span>{{ track.averageRating }} average rating</span>
            <span>{{ track.ratingsCount }} ratings</span>
            <span>{{ track.comments.length }} comments</span>
          </div>

          <div class="track-detail-actions">
            <button
              type="button"
              class="button button--primary"
              @click="addToPlaylist"
            >
              Add to playlist
            </button>

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

      <div class="track-detail-layout">
        <section class="track-detail-panel">
          <div class="track-detail-panel__header">
            <h2>Embedded player</h2>
          </div>

          <div class="track-embed-wrapper">
            <iframe
              :src="track.embedUrl"
              title="Track player"
              frameborder="0"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
              "
              allowfullscreen
            ></iframe>
          </div>
        </section>

        <section class="track-detail-panel">
          <div class="track-detail-panel__header">
            <h2>Your rating</h2>
          </div>

          <p class="track-detail-panel__text">Rate this track from 1 to 5.</p>

          <div class="track-rating-picker">
            <button
              v-for="value in 5"
              :key="value"
              type="button"
              class="track-rating-picker__star"
              :class="{ 'is-active': value <= selectedRating }"
              @click="setRating(value)"
            >
              ★
            </button>
          </div>

          <p class="track-rating-picker__value">
            {{
              selectedRating
                ? `${selectedRating}/5 selected`
                : "No rating selected yet"
            }}
          </p>
        </section>
      </div>

      <section class="track-detail-panel track-comments-panel">
        <div class="track-detail-panel__header">
          <h2>Comments</h2>
        </div>

        <div v-if="track.comments.length" class="track-comment-list">
          <article
            v-for="comment in track.comments"
            :key="comment.id"
            class="track-comment-card"
          >
            <div class="track-comment-card__top">
              <strong>{{ comment.username }}</strong>
              <span>{{ comment.createdAt }}</span>
            </div>

            <p>{{ comment.content }}</p>
          </article>
        </div>

        <div v-else class="track-detail-empty-state">
          <p>No comments yet.</p>
        </div>
      </section>
    </div>
  </section>
</template>
