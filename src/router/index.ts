import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "dashboard",
    component: () => import("@/views/Dashboard.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/books/:id",
    name: "book-page",
    component: () => import("@/views/BookPage.vue"),
    props: true,
  },

  {
    path: "/movies/:id",
    name: "movie-page",
    component: () => import("@/views/MoviePage.vue"),
    props: true,
  },

  {
    path: "/games/:id",
    name: "game-page",
    component: () => import("@/views/GamePage.vue"),
    props: true,
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/{auth}/Login.vue"),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("@/views/ProfilePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("@/views/{auth}/Register.vue"),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/components/error/NotFound.vue"),
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    } else {
      return { left: 0, top: 0 };
    }
  },
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth as boolean;
  const guestOnly = to.meta.guestOnly as boolean;

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: "login", query: { redirect: to.fullPath } });
  }
  else if (guestOnly && authStore.isAuthenticated) {
    next({ name: "dashboard" });
  } else {
    next();
  }
});

export default router;
