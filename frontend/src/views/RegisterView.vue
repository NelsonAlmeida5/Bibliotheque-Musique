<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    await authStore.register({
      username: username.value,
      email: email.value,
      password: password.value,
    })

    successMessage.value = 'Account created successfully. You can now log in.'

    setTimeout(() => {
      router.push('/login')
    }, 900)
  } catch (error) {
    console.error(error)

    errorMessage.value =
      error?.response?.data?.message ||
      'Registration failed. Please check your information.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="container auth-page__inner">
      <div class="auth-card">
        <p class="auth-eyebrow">Nightwave account</p>

        <h1>Sign up</h1>

        <p class="auth-subtitle">
          Create your account to save playlists, favorites, and personal tracks.
        </p>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="auth-field">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Choose a username"
              autocomplete="username"
              required
            />
          </div>

          <div class="auth-field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              required
            />
          </div>

          <div class="auth-field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Create a password"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="auth-field">
            <label for="passwordConfirmation">Confirm password</label>
            <input
              id="passwordConfirmation"
              v-model="passwordConfirmation"
              type="password"
              placeholder="Repeat your password"
              autocomplete="new-password"
              required
            />
          </div>

          <p v-if="errorMessage" class="auth-error">
            {{ errorMessage }}
          </p>

          <p v-if="successMessage" class="auth-success">
            {{ successMessage }}
          </p>

          <button class="button button--primary auth-submit" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Creating account...' : 'Create account' }}
          </button>
        </form>

        <p class="auth-switch">
          Already have an account?
          <RouterLink to="/login">Log in</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>