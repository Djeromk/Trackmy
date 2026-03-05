<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from "./ThemeToggle.vue"
import AppLogo from './AppLogo.vue'

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
    <nav class="mx-auto px-4 sm:px-6 lg:px-8 bg-(--primary-100)">
      <div class="flex justify-between items-center h-16  ">
       <AppLogo />

        <div class="flex items-center space-x-4">
          <ThemeToggle />
          <template v-if="authStore.isAuthenticated">
            <router-link :to="{ path: '/', hash: '#my-lists' }"
              class="px-4 py-2 rounded-xl text-(--text-primary) hover:text-primary-600 transition-colors">
              Мои списки
            </router-link>

            <!--
              Аватар с инициалами — ведёт на страницу профиля.
              Кнопка \"Выйти\" перенесена в ProfilePage.vue.
              Для демо-пользователя рядом показываем небольшой бейдж.
            -->
            <div class="flex items-center gap-2">
              <router-link to="/profile"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all hover:scale-105 hover:shadow-md"
                style="background: linear-gradient(135deg, var(--primary-500), var(--primary-700))"
                :title="authStore.profile?.name ?? 'Профиль'">
                {{ userInitials }}
              </router-link>
              <span v-if="authStore.isDemoUser" class="px-2 py-0.5 rounded-full text-xs font-medium"
                style="background: rgba(251, 191, 36, 0.18); color: #92400e;">
                Демо
              </span>
            </div>
          </template>

          <template v-else>
            <router-link to="/login"
              class="px-4 py-2 rounded-xl text-(--text-primary) hover:text-primary-600 transition-colors">
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
</template>

<style>
@media (max-width: 640px) {
  header nav {
    padding: 0 12px; /* было 16px */
  }

  header nav .flex {
    gap: 8px; /* уменьшить расстояние между элементами */
  }

  header nav a,
  header nav button {
    font-size: 13px; /* было 15px */
    padding: 6px 10px; /* уменьшить padding */
  }

  /* Аватар пользователя */
  header nav a[title*="Профиль"] {
    width: 32px;  /* было 36px */
    height: 32px;
  }

  /* Бейдж "Демо" */
  header nav span[class*="px-2"] {
    padding: 2px 6px;
    font-size: 10px;
  }
}
</style>
