<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.loadFromStorage()
})

const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

<template>
  <footer class="site-footer">
    <div class="container footer">
      <div class="footer__brand-block">
        <div class="footer__brand">Nightwave</div>
        <p class="footer__tagline">Soundtracks for the night ahead.</p>
      </div>

      <div class="footer__column">
        <h4>Explore</h4>
        <RouterLink to="/tracks">Catalog</RouterLink>
        <RouterLink to="/artists">Artists</RouterLink>
      </div>

      <div class="footer__column">
        <h4>Account</h4>
        <template v-if="!isAuthenticated">
          <RouterLink to="/login">Log in</RouterLink>
          <RouterLink to="/register">Sign up</RouterLink>
        </template>
        <template v-else>
          <RouterLink to="/my-playlists">My Playlists</RouterLink>
          <RouterLink to="/favorites">Favorites</RouterLink>
        </template>
      </div>

      <div class="footer__column">
        <h4>Info</h4>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>
    </div>

    <div class="container footer__bottom">
      <p>© 2026 Nightwave. All rights reserved.</p>
    </div>
  </footer>
</template>