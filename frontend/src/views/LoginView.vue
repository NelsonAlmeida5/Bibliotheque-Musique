<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const identifier = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

function extractApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors[0]?.message || fallbackMessage;
  }

  if (
    typeof responseData?.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

async function handleLogin() {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    await authStore.login(identifier.value, password.value);
    router.push("/");
  } catch (error) {
    console.error(error);

    errorMessage.value = extractApiErrorMessage(
      error,
      "Login failed. Please check your email/username and password.",
    );
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="container auth-page__inner">
      <div class="auth-card">
        <p class="auth-eyebrow">Nightwave account</p>

        <h1>Log in</h1>

        <p class="auth-subtitle">
          Access your playlists, favorites, and personal tracks.
        </p>

        <form class="auth-form" @submit.prevent="handleLogin">
          <div class="auth-field">
            <label for="identifier">Email or username</label>
            <input
              id="identifier"
              v-model="identifier"
              type="text"
              placeholder="Enter your email or username"
              autocomplete="username"
              required
            />
          </div>

          <div class="auth-field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="errorMessage" class="auth-error">
            {{ errorMessage }}
          </p>

          <button
            class="button button--primary auth-submit"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? "Logging in..." : "Log in" }}
          </button>
        </form>

        <p class="auth-switch">
          Don’t have an account?
          <RouterLink to="/register">Create one</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
