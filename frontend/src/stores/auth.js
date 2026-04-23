import { defineStore } from "pinia";
import api from "../services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === "admin",
  },

  actions: {
    loadFromStorage() {
      this.token = localStorage.getItem("token") || null;
      this.user = JSON.parse(localStorage.getItem("user") || "null");
    },

    setAuthData(token, user = null) {
      this.token = token;
      this.user = user;

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    },

    clearAuth() {
      this.token = null;
      this.user = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    async login(identifier, password) {
      const response = await api.post("/login", {
        identifier: identifier.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const tokenCandidate =
        response.data?.token?.token ??
        response.data?.token?.value ??
        response.data?.accessToken?.token ??
        response.data?.accessToken?.value ??
        response.data?.access_token?.token ??
        response.data?.access_token?.value ??
        (typeof response.data?.token === "string"
          ? response.data.token
          : null) ??
        (typeof response.data?.accessToken === "string"
          ? response.data.accessToken
          : null) ??
        (typeof response.data?.access_token === "string"
          ? response.data.access_token
          : null);

      if (!tokenCandidate || typeof tokenCandidate !== "string") {
        throw new Error("Token not found in login response");
      }

      const user = response.data?.user ?? null;

      this.setAuthData(tokenCandidate, user);

      if (!user) {
        await this.fetchMe();
      }
    },

    async register(payload) {
      const response = await api.post("/register", {
        username: payload.username.trim(),
        email: payload.email.trim(),
        password: payload.password,
      });

      return response.data;
    },

    async fetchMe() {
      const response = await api.get("/me");
      this.user = response.data;
      localStorage.setItem("user", JSON.stringify(this.user));
    },

    async logout() {
      try {
        await api.post("/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }

      this.clearAuth();
    },
  },
});
