<script setup>
import { computed, onMounted } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

onMounted(() => {
  authStore.loadFromStorage();
});

const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAdmin = computed(() => authStore.isAdmin);
const username = computed(() => authStore.user?.username || "User");

const userInitial = computed(() => {
  const name = authStore.user?.username || "U";
  return name.charAt(0).toUpperCase();
});

const isHomeActive = computed(() => route.name === "home");
const isCatalogActive = computed(
  () => route.name === "tracks" || route.name === "track-detail",
);
const isArtistsActive = computed(
  () => route.name === "artists" || route.name === "artist-detail",
);

const isMyTracksActive = computed(() => route.path.startsWith("/my-tracks"));
const isMyPlaylistsActive = computed(() =>
  route.path.startsWith("/my-playlists"),
);
const isFavoritesActive = computed(() => route.path.startsWith("/favorites"));
const isAdminActive = computed(() => route.path.startsWith("/admin"));

async function handleLogout() {
  await authStore.logout();
  router.push("/");
}
</script>

<template>
  <header class="site-header">
    <div class="container navbar">
      <div class="navbar__left">
        <RouterLink to="/" class="navbar__brand">Nightwave</RouterLink>

        <nav class="navbar__nav">
          <RouterLink
            to="/"
            class="navbar__link"
            :class="{ 'is-active': isHomeActive }"
          >
            Home
          </RouterLink>

          <RouterLink
            to="/tracks"
            class="navbar__link"
            :class="{ 'is-active': isCatalogActive }"
          >
            Catalog
          </RouterLink>

          <RouterLink
            to="/artists"
            class="navbar__link"
            :class="{ 'is-active': isArtistsActive }"
          >
            Artists
          </RouterLink>
        </nav>
      </div>

      <div class="navbar__right">
        <template v-if="!isAuthenticated">
          <RouterLink to="/login" class="navbar__auth-link">Log in</RouterLink>
          <RouterLink to="/register" class="button button--primary button--sm">
            Sign up
          </RouterLink>
        </template>

        <template v-else>
          <RouterLink
            to="/my-tracks"
            class="navbar__auth-link"
            :class="{ 'is-active': isMyTracksActive }"
          >
            My Tracks
          </RouterLink>

          <RouterLink
            to="/my-playlists"
            class="navbar__auth-link"
            :class="{ 'is-active': isMyPlaylistsActive }"
          >
            My Playlists
          </RouterLink>

          <RouterLink
            to="/favorites"
            class="navbar__auth-link"
            :class="{ 'is-active': isFavoritesActive }"
          >
            Favorites
          </RouterLink>

          <RouterLink
            v-if="isAdmin"
            to="/admin"
            class="navbar__auth-link"
            :class="{ 'is-active': isAdminActive }"
          >
            Dashboard
          </RouterLink>

          <div class="navbar__avatar" :title="username">
            {{ userInitial }}
          </div>

          <button class="button button--ghost button--sm" @click="handleLogout">
            Log out
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
