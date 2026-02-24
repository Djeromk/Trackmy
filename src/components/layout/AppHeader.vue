<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from "./ThemeToggle.vue"

const authStore = useAuthStore()

const userInitials = computed(() => {
  const name = authStore.profile?.name ?? authStore.userEmail
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <header v-if="authStore.isAuthenticated">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <router-link
        to="/"
        class="text-4xl font-extrabold text-primary-600 hover:text-primary-700 transition-colors"
        >
        Media Archive
      </router-link>

      <div class="flex items-center space-x-4">
        <ThemeToggle />
        <template v-if="authStore.isAuthenticated">
            <router-link
              :to="{ path: '/', hash: '#my-lists' }"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Мои списки
            </router-link>

            <!--
              Аватар с инициалами — ведёт на страницу профиля.
              Кнопка "Выйти" перенесена в ProfilePage.vue.
            -->
            <router-link
              to="/profile"
              class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all hover:scale-105 hover:shadow-md"
              style="background: linear-gradient(135deg, var(--primary-500), var(--primary-700))"
              :title="authStore.profile?.name ?? 'Профиль'"
            >
              {{ userInitials }}
            </router-link>
          </template>

          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Войти
            </router-link>
            <router-link
              to="/register"
              class="btn-(--neo-primary)"
            >
              Регистрация
            </router-link>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>
<!-- <script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await authStore.signOut();
  router.push("/");
}
</script>

<template>
  <header class="bg-(--neo-background)">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <router-link
          to="/"
          class="text-4xl font-extrabold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Media Archive
        </router-link>

        <div class="flex items-center space-x-4">
          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/my-lists"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Мои списки
            </router-link>
            <router-link
              to="/profile"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Профиль
            </router-link>
            <button @click="handleLogout" class="btn-neo text-sm">Выйти</button>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Войти
            </router-link>
            <router-link to="/register" class="btn-(--neo-primary)">
              Регистрация
            </router-link>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template> -->
