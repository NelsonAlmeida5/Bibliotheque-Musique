<script setup>
import AppNavbar from './components/layout/AppNavbar.vue'
</script>

<template>
  <div class="app-layout">
    <AppNavbar />

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>