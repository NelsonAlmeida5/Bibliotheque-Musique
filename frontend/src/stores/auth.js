import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    loadFromStorage() {
      this.token = localStorage.getItem('token') || null
      this.user = JSON.parse(localStorage.getItem('user') || 'null')
    },

    setAuthData(token, user = null) {
      this.token = token
      this.user = user

      localStorage.setItem('token', token)

      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }
    },

    clearAuth() {
      this.token = null
      this.user = null

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async login(email, password) {
      const response = await api.post('/login', { email, password })

      const token =
        response.data?.token?.token ||
        response.data?.token?.value ||
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.access_token

      if (!token) {
        throw new Error('Token not found in login response')
      }

      this.setAuthData(token)

      await this.fetchMe()
    },

    async fetchMe() {
      const response = await api.get('/me')
      this.user = response.data
      localStorage.setItem('user', JSON.stringify(this.user))
    },

    async logout() {
      try {
        await api.post('/logout')
      } catch (error) {
        console.error('Logout error:', error)
      }

      this.clearAuth()
    },
  },
})