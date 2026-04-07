<!-- src/components/layout/AppHeader.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Home, Library, BarChart3 } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'
import AppLogo from './AppLogo.vue'
import HeaderSearch from './HeaderSearch.vue'

const authStore = useAuthStore()
const route = useRoute()

const navItems = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/library', label: 'Библиотека', icon: Library },
  { path: '/stats', label: 'Статистика', icon: BarChart3 }
]

/**
 * userInitials — первые буквы имени для аватара.
 * "Иван Иванов" → "ИИ", "Алиса" → "АЛ", нет имени → "?"
 */
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
    <nav class="mx-auto px-4 sm:px-6 bg-(--primary-100)">
      <!-- Верхний ряд: логотип + поиск + аватар -->
      <div class="flex justify-between items-center h-16 gap-3">

        <!-- Логотип слева -->
        <AppLogo class="shrink-0" />

        <!--
          Строка поиска по центру.
          На мобильных показывает только иконку лупы,
          на десктопе — полную строку с кнопками категорий.
          flex-1 позволяет строке занять доступное пространство между
          логотипом и правыми элементами.
        -->
        <div class="flex-1 flex justify-center">
          <HeaderSearch />
        </div>

        <!-- Правая группа: ссылки + аватар + тема -->
        <div class="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <template v-if="authStore.isAuthenticated">
            <!--
              Аватар с инициалами → страница профиля.
              Кнопка «Выйти» находится в ProfilePage.vue.
            -->
            <div class="flex items-center gap-1.5">
              <router-link
                to="/profile"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all hover:scale-105 hover:shadow-md"
                style="background: linear-gradient(135deg, var(--primary-500), var(--primary-700))"
                :title="authStore.profile?.name ?? 'Профиль'"
              >
                {{ userInitials }}
              </router-link>

              <span
                v-if="authStore.isDemoUser"
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                style="background: rgba(251, 191, 36, 0.18); color: #92400e;"
              >
                Демо
              </span>
            </div>
          </template>

          <template v-else>
            <router-link
              to="/login"
              class="px-3 py-2 rounded-xl text-sm text-(--text-primary) hover:text-(--primary-600) transition-colors"
            >
              Войти
            </router-link>
            <router-link to="/register" class="btn-primary text-sm px-3 py-2">
              Регистрация
            </router-link>
          </template>
      </div>

      <!-- Второй ряд: навигационные табы — только на десктопе -->
      <div class="hidden md:flex items-center gap-1 border-t border-(--border-color) border-opacity-40 py-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-tab"
          :class="{ 'nav-tab--active': route.path === item.path }"
        >
          <component :is="item.icon" :size="15" />
          {{ item.label }}
        </router-link>
      </div>

    </nav>
  </header>
</template>

<style scoped>
.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: all var(--transition-base);
}

.nav-tab:hover {
  color: var(--text-primary);
  background-color: var(--background-hover);
}

.nav-tab--active {
  color: var(--primary-600);
  background-color: color-mix(in srgb, var(--primary-100) 60%, transparent);
  font-weight: 600;
}

@media (max-width: 640px) {
  header nav {
    padding: 0 12px;
  }
}
</style>
