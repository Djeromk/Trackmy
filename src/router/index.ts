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
    path: "/library",
    name: "library",
    component: () => import("@/views/LibraryView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/stats",
    name: "stats",
    component: () => import("@/views/StatsView.vue"),
    meta: { requiresAuth: true },
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
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/views/{auth}/ResetPassword.vue"),
    meta: { requiresAuth: false },
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

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!authStore.loading) {
          clearInterval(interval);
          resolve();
        }
      }, 16);
    });
  }

  const requiresAuth = to.meta.requiresAuth as boolean;
  const guestOnly = to.meta.guestOnly as boolean;
  // if (!authStore.isAuthenticated) {
  //   await authStore.initialize();
  // }
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: "login", query: { redirect: to.fullPath } });
  } else if (guestOnly && authStore.isAuthenticated) {
    next({ name: "dashboard" });
  } else {
    next();
  }
});

export default router;
