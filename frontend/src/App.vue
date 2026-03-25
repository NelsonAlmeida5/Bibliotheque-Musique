<script setup>
import AppNavbar from './components/layout/AppNavbar.vue'
import AppFooter from './components/layout/AppFooter.vue'
</script>

<template>
  <div class="app-layout">
    <AppNavbar />

    <main class="main-content">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>