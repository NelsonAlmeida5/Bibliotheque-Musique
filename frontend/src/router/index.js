import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import TracksView from "../views/TracksView.vue";
import TrackDetailView from "../views/TrackDetailView.vue";
import ArtistsView from "../views/ArtistsView.vue";
import ArtistDetailView from "../views/ArtistDetailView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import MyTracksView from "../views/MyTracksView.vue";
import MyPlaylistsView from "../views/MyPlaylistsView.vue";
import PlaylistDetailView from "../views/PlaylistDetailView.vue";
import FavoritesView from "../views/FavoritesView.vue";
import AdminView from "../views/AdminView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/tracks", name: "tracks", component: TracksView },
    { path: "/tracks/:id", name: "track-detail", component: TrackDetailView },
    { path: "/artists", name: "artists", component: ArtistsView },
    {
      path: "/artists/:id",
      name: "artist-detail",
      component: ArtistDetailView,
    },

    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guestOnly: true },
    },

    {
      path: "/my-tracks",
      name: "my-tracks",
      component: MyTracksView,
      meta: { requiresAuth: true },
    },
    {
      path: "/my-playlists",
      name: "my-playlists",
      component: MyPlaylistsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/my-playlists/:id",
      name: "playlist-detail",
      component: PlaylistDetailView,
      meta: { requiresAuth: true },
    },

    {
      path: "/favorites",
      name: "favorites",
      component: FavoritesView,
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { requiresAdmin: true },
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isAuthenticated = !!token;
  const isAdmin = user?.role === "admin";

  if (to.meta.requiresAdmin && !isAdmin) {
    return "/";
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return "/login";
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return "/";
  }

  return true;
});

export default router;
