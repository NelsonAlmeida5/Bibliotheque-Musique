<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import api from "../services/api";

const route = useRoute();

const track = ref(null);
const comments = ref([]);
const playlists = ref([]);

const isLoading = ref(true);
const isAuthLoading = ref(false);
const isSubmittingComment = ref(false);
const isSubmittingRating = ref(false);
const isSubmittingFavorite = ref(false);
const isSubmittingPlaylist = ref(false);

const pageError = ref("");
const actionError = ref("");
const actionSuccess = ref("");

const commentInput = ref("");
const selectedPlaylistId = ref("");

const isFavorite = ref(false);
const myRating = ref(0);
const averageRating = ref(null);
const ratingsCount = ref(0);

const currentUser = ref(readStoredUser());
const isAuthenticated = computed(
  () => !!localStorage.getItem("token") && !!currentUser.value,
);

const trackId = computed(() => Number(route.params.id));

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
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

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeTrack(item) {
  return {
    id: item.id,
    title: item.title ?? "",
    description: item.description ?? "",
    embedUrl: item.embedUrl ?? item.embed_url ?? "",
    coverUrl: item.coverUrl ?? item.cover_url ?? "",
    createdAt: item.createdAt ?? item.created_at ?? null,
    artist: item.artist
      ? {
          id: item.artist.id,
          name: item.artist.name ?? "Unknown artist",
        }
      : null,
    category: item.category
      ? {
          id: item.category.id,
          name: item.category.name ?? "Uncategorized",
        }
      : null,
    user: item.user
      ? {
          id: item.user.id,
          username: item.user.username ?? item.user.email ?? "Unknown user",
        }
      : null,
    customArtistName: item.customArtistName ?? item.custom_artist_name ?? null,
    customCategoryName:
      item.customCategoryName ?? item.custom_category_name ?? null,
    ratings: Array.isArray(item.ratings)
      ? item.ratings.map((rating) => ({
          id: rating.id,
          rating: rating.rating ?? 0,
        }))
      : [],
  };
}

function normalizeComment(item) {
  return {
    id: item.id,
    content: item.content ?? "",
    createdAt: item.createdAt ?? item.created_at ?? null,
    userId: item.userId ?? item.user_id ?? item.user?.id ?? null,
    username:
      item.user?.username ??
      item.user?.email ??
      item.username ??
      "Unknown user",
  };
}

function normalizePlaylist(item) {
  return {
    id: item.id,
    name: item.name ?? "Untitled playlist",
    description: item.description ?? "",
  };
}

function normalizeFavoriteTrackId(item) {
  return item.trackId ?? item.track_id ?? item.track?.id ?? null;
}

function getTrackArtistLabel(trackValue) {
  if (trackValue?.artist?.name) return trackValue.artist.name;
  if (trackValue?.customArtistName) return trackValue.customArtistName;
  return "Unknown artist";
}

function getTrackCategoryLabel(trackValue) {
  if (trackValue?.category?.name) return trackValue.category.name;
  if (trackValue?.customCategoryName) return trackValue.customCategoryName;
  return "Uncategorized";
}

function getTrackCoverStyle(trackValue) {
  if (!trackValue?.coverUrl) return {};

  return {
    backgroundImage: `url("${trackValue.coverUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function formatAverageRating(value) {
  if (value === null || value === undefined) return "No rating yet";
  return `${Number(value).toFixed(1)} average rating`;
}

function formatCommentDate(dateValue) {
  if (!dateValue) return "Unknown date";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function extractYouTubeVideoId(rawUrl) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return pathParts[0] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      if (pathParts[0] === "embed" && pathParts[1]) {
        return pathParts[1];
      }

      if (pathParts[0] === "shorts" && pathParts[1]) {
        return pathParts[1];
      }

      if (pathParts[0] === "live" && pathParts[1]) {
        return pathParts[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

const normalizedEmbedUrl = computed(() => {
  if (!track.value?.embedUrl) return "";

  const videoId = extractYouTubeVideoId(track.value.embedUrl);

  if (videoId) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
      origin: window.location.origin,
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  return track.value.embedUrl;
});

const commentsCount = computed(() => comments.value.length);

function computeGuestRatingSummary(trackValue) {
  const ratings = trackValue?.ratings ?? [];
  const count = ratings.length;

  if (!count) {
    averageRating.value = null;
    ratingsCount.value = 0;
    return;
  }

  const average =
    ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count;

  averageRating.value = average;
  ratingsCount.value = count;
}

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    fallbackMessage
  );
}

function canManageComment(comment) {
  if (!currentUser.value) return false;

  return (
    currentUser.value.role === "admin" ||
    Number(comment.userId) === Number(currentUser.value.id)
  );
}

async function loadPublicData() {
  const [trackResponse, commentsResponse] = await Promise.all([
    api.get(`/tracks/${trackId.value}`),
    api.get(`/tracks/${trackId.value}/comments`),
  ]);

  track.value = normalizeTrack(trackResponse.data);
  comments.value = extractCollection(commentsResponse.data).map(
    normalizeComment,
  );

  computeGuestRatingSummary(track.value);
}

async function loadAuthData() {
  if (!isAuthenticated.value) {
    isFavorite.value = false;
    myRating.value = 0;
    playlists.value = [];
    selectedPlaylistId.value = "";
    return;
  }

  isAuthLoading.value = true;

  try {
    const [ratingResponse, favoritesResponse, playlistsResponse] =
      await Promise.all([
        api.get(`/tracks/${trackId.value}/rating`),
        api.get("/favorite-tracks"),
        api.get("/my-playlists"),
      ]);

    myRating.value = ratingResponse.data?.myRating?.rating ?? 0;
    averageRating.value =
      ratingResponse.data?.averageRating ?? averageRating.value;
    ratingsCount.value =
      ratingResponse.data?.ratingsCount ?? ratingsCount.value;

    const favoriteItems = extractCollection(favoritesResponse.data);
    isFavorite.value = favoriteItems.some(
      (favorite) =>
        Number(normalizeFavoriteTrackId(favorite)) === trackId.value,
    );

    playlists.value = extractCollection(playlistsResponse.data).map(
      normalizePlaylist,
    );

    if (
      !playlists.value.some(
        (playlist) => String(playlist.id) === selectedPlaylistId.value,
      )
    ) {
      selectedPlaylistId.value = "";
    }
  } finally {
    isAuthLoading.value = false;
  }
}

async function loadPage() {
  isLoading.value = true;
  pageError.value = "";
  clearFeedback();

  try {
    currentUser.value = readStoredUser();
    await loadPublicData();
    await loadAuthData();
  } catch (error) {
    pageError.value = getApiErrorMessage(
      error,
      "Unable to load this track right now.",
    );
    track.value = null;
    comments.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function toggleFavorite() {
  if (!isAuthenticated.value) {
    actionError.value = "You must be logged in to manage favorites.";
    return;
  }

  clearFeedback();
  isSubmittingFavorite.value = true;

  try {
    if (isFavorite.value) {
      await api.delete(`/favorite-tracks/${trackId.value}`);
      isFavorite.value = false;
      actionSuccess.value = "Track removed from favorites.";
    } else {
      await api.post("/favorite-tracks", { track_id: trackId.value });
      isFavorite.value = true;
      actionSuccess.value = "Track added to favorites.";
    }
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to update favorites right now.",
    );
  } finally {
    isSubmittingFavorite.value = false;
  }
}

async function submitRating(value) {
  if (!isAuthenticated.value) {
    actionError.value = "You must be logged in to rate this track.";
    return;
  }

  clearFeedback();
  isSubmittingRating.value = true;

  try {
    await api.post(`/tracks/${trackId.value}/rating`, { rating: value });
    myRating.value = value;

    const refreshed = await api.get(`/tracks/${trackId.value}/rating`);
    myRating.value = refreshed.data?.myRating?.rating ?? value;
    averageRating.value = refreshed.data?.averageRating ?? averageRating.value;
    ratingsCount.value = refreshed.data?.ratingsCount ?? ratingsCount.value;

    actionSuccess.value = "Rating saved successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to save your rating.",
    );
  } finally {
    isSubmittingRating.value = false;
  }
}

async function submitComment() {
  if (!isAuthenticated.value) {
    actionError.value = "You must be logged in to comment on this track.";
    return;
  }

  if (!commentInput.value.trim()) {
    actionError.value = "Please write a comment before submitting.";
    return;
  }

  clearFeedback();
  isSubmittingComment.value = true;

  try {
    await api.post(`/tracks/${trackId.value}/comments`, {
      content: commentInput.value.trim(),
    });

    commentInput.value = "";
    const response = await api.get(`/tracks/${trackId.value}/comments`);
    comments.value = extractCollection(response.data).map(normalizeComment);

    actionSuccess.value = "Comment posted successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to post your comment.",
    );
  } finally {
    isSubmittingComment.value = false;
  }
}

async function deleteComment(comment) {
  clearFeedback();

  const confirmed = window.confirm("Delete this comment permanently?");
  if (!confirmed) return;

  try {
    await api.delete(`/comments/${comment.id}`);
    comments.value = comments.value.filter((item) => item.id !== comment.id);
    actionSuccess.value = "Comment deleted successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to delete this comment.",
    );
  }
}

async function addToPlaylist() {
  if (!isAuthenticated.value) {
    actionError.value = "You must be logged in to add tracks to a playlist.";
    return;
  }

  if (!selectedPlaylistId.value) {
    actionError.value = "Please select one of your playlists first.";
    return;
  }

  clearFeedback();
  isSubmittingPlaylist.value = true;

  try {
    await api.post(`/my-playlists/${selectedPlaylistId.value}/tracks`, {
      track_id: trackId.value,
    });

    actionSuccess.value = "Track added to playlist successfully.";
  } catch (error) {
    actionError.value = getApiErrorMessage(
      error,
      "Unable to add this track to the selected playlist.",
    );
  } finally {
    isSubmittingPlaylist.value = false;
  }
}

onMounted(() => {
  loadPage();
});

watch(
  () => route.params.id,
  () => {
    loadPage();
  },
);
</script>

<template>
  <section class="track-detail-page">
    <div class="container">
      <RouterLink to="/tracks" class="track-detail-back-link">
        ← Back to Catalog
      </RouterLink>

      <div v-if="pageError" class="track-detail-panel">
        <p class="auth-error">{{ pageError }}</p>
      </div>

      <template v-else-if="track">
        <section class="track-detail-hero">
          <div
            class="track-detail-hero__cover"
            :style="getTrackCoverStyle(track)"
          ></div>

          <div class="track-detail-hero__content">
            <p class="track-detail-eyebrow">
              {{ getTrackCategoryLabel(track) }}
            </p>

            <h1>{{ track.title }}</h1>

            <p class="track-detail-artist-line">
              by
              <RouterLink
                :to="{
                  name: 'artist-detail',
                  params: { id: track.artist?.id },
                }"
              >
                {{ getTrackArtistLabel(track) }}
              </RouterLink>
            </p>

            <p class="track-detail-description">
              {{ track.description || "No description provided." }}
            </p>

            <div class="track-detail-stats">
              <span>{{ formatAverageRating(averageRating) }}</span>
              <span>{{ ratingsCount }} ratings</span>
              <span>{{ commentsCount }} comments</span>
            </div>

            <p v-if="actionError" class="auth-error track-detail-feedback">
              {{ actionError }}
            </p>
            <p v-if="actionSuccess" class="auth-success track-detail-feedback">
              {{ actionSuccess }}
            </p>

            <div class="track-detail-actions">
              <div class="track-detail-playlist-inline">
                <select
                  v-model="selectedPlaylistId"
                  class="track-detail-select"
                  :disabled="
                    !isAuthenticated || isAuthLoading || !playlists.length
                  "
                >
                  <option value="" disabled>
                    {{
                      playlists.length
                        ? "Select playlist"
                        : "No playlists available"
                    }}
                  </option>
                  <option
                    v-for="playlist in playlists"
                    :key="playlist.id"
                    :value="String(playlist.id)"
                  >
                    {{ playlist.name }}
                  </option>
                </select>

                <button
                  type="button"
                  class="button button--ghost"
                  :disabled="
                    isSubmittingPlaylist ||
                    !isAuthenticated ||
                    !playlists.length ||
                    !selectedPlaylistId
                  "
                  @click="addToPlaylist"
                >
                  {{ isSubmittingPlaylist ? "Adding..." : "Add to playlist" }}
                </button>

                <button
                  type="button"
                  class="button button--ghost"
                  :disabled="isSubmittingFavorite || !isAuthenticated"
                  @click="toggleFavorite"
                >
                  {{ isFavorite ? "♥ Favorited" : "♡ Add to favorites" }}
                </button>
              </div>
            </div>

            <p v-if="!isAuthenticated" class="track-detail-login-hint">
              <RouterLink to="/login">Log in</RouterLink>
              to rate, comment, favorite, and add this track to a playlist.
            </p>
          </div>
        </section>

        <div class="track-detail-layout">
          <section class="track-detail-panel">
            <div class="track-detail-panel__header">
              <h2>Embedded player</h2>
            </div>

            <div class="track-embed-wrapper">
              <iframe
                :src="normalizedEmbedUrl"
                title="Track player"
                frameborder="0"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="
                  accelerometer;
                  autoplay;
                  clipboard-write;
                  encrypted-media;
                  gyroscope;
                  picture-in-picture;
                  web-share;
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
                :class="{ 'is-active': value <= myRating }"
                :disabled="isSubmittingRating || !isAuthenticated"
                @click="submitRating(value)"
              >
                ★
              </button>
            </div>

            <p class="track-rating-picker__value">
              {{
                myRating ? `${myRating}/5 selected` : "No rating selected yet"
              }}
            </p>
          </section>
        </div>

        <section class="track-detail-panel track-comments-panel">
          <div class="track-detail-panel__header">
            <h2>Comments</h2>
          </div>

          <div class="track-comment-form">
            <textarea
              v-model="commentInput"
              class="track-comment-form__textarea"
              placeholder="Write your comment..."
              :disabled="isSubmittingComment || !isAuthenticated"
            ></textarea>

            <div class="track-comment-form__footer">
              <span class="track-comment-form__hint">
                Public comments only.
              </span>

              <button
                type="button"
                class="button button--primary"
                :disabled="isSubmittingComment || !isAuthenticated"
                @click="submitComment"
              >
                {{ isSubmittingComment ? "Posting..." : "Post comment" }}
              </button>
            </div>
          </div>

          <div v-if="comments.length" class="track-comment-list">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="track-comment-card"
            >
              <div class="track-comment-card__top">
                <div>
                  <strong>{{ comment.username }}</strong>
                  <span>{{ formatCommentDate(comment.createdAt) }}</span>
                </div>

                <button
                  v-if="canManageComment(comment)"
                  type="button"
                  class="button button--ghost button--sm"
                  @click="deleteComment(comment)"
                >
                  Delete
                </button>
              </div>

              <p>{{ comment.content }}</p>
            </article>
          </div>

          <div v-else class="track-detail-empty-state">
            <p>No comments yet.</p>
          </div>
        </section>
      </template>

      <div v-else-if="isLoading" class="track-detail-panel">
        <p class="track-detail-empty-state">Loading track...</p>
      </div>
    </div>
  </section>
</template>
