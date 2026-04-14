<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, Library, BarChart3 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const navItems = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/library', label: 'Библиотека', icon: Library },
  { path: '/stats', label: 'Статистика', icon: BarChart3 }
]
</script>

<template>
  <!-- Bottom Navigation — видно только на мобильных (max-width: 768px) -->
  <nav v-if="authStore.isAuthenticated" class="fixed bottom-0 left-0 right-0 md:hidden bg-(--primary-100) border-t border-(--border-color) z-40">
    <div class="flex justify-around items-center h-16 px-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item--active': route.path === item.path }"
      >
        <component :is="item.icon" :size="20" class="mb-1" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>

  <!-- На большых экранах ничего не показываем -->
</template>

<style scoped>
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0.5rem;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: all var(--transition-base);
  cursor: pointer;
  border-radius: 0.5rem;
}

.nav-item:hover {
  color: var(--text-primary);
  background-color: var(--background-hover);
}

.nav-item--active {
  color: var(--primary-600);
  background-color: var(--primary-100);
}
</style>
