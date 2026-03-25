<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  authStore.loadFromStorage()
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const username = computed(() => authStore.user?.username || 'User')

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar__left">
      <RouterLink to="/" class="navbar__brand">Music Library</RouterLink>
    </div>

    <nav class="navbar__right">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/tracks">Tracks</RouterLink>
      <RouterLink to="/artists">Artists</RouterLink>

      <RouterLink v-if="isAuthenticated" to="/my-tracks">My Tracks</RouterLink>
      <RouterLink v-if="isAuthenticated" to="/my-playlists">My Playlists</RouterLink>
      <RouterLink v-if="isAuthenticated" to="/favorites">Favorites</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin">Admin</RouterLink>

      <template v-if="!isAuthenticated">
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/register">Register</RouterLink>
      </template>

      <template v-else>
        <span class="user-badge">{{ username }}</span>
        <button class="logout-btn" @click="handleLogout">Logout</button>
      </template>
    </nav>
  </header>
</template>