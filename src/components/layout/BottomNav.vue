<!-- src/components/layout/BottomNav.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, BookMarked, BarChart3 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const navItems = [
  { to: '/',        label: 'Главная',    icon: Home },
  { to: '/library', label: 'Библиотека', icon: BookMarked },
  { to: '/stats',   label: 'Статистика', icon: BarChart3 },
]
</script>

<template>
  <nav v-if="authStore.isAuthenticated" class="bottom-nav" aria-label="Основная навигация">
    <!-- Desktop: горизонтальная полоса табов под хедером -->
    <div class="desktop-nav">
      <div class="desktop-nav__inner">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="desktop-tab"
          :class="{ 'desktop-tab--active': route.path === item.to }"
        >
          <component :is="item.icon" :size="15" />
          {{ item.label }}
        </router-link>
      </div>
    </div>

    <!-- Mobile: фиксированная панель снизу -->
    <div class="mobile-nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="mobile-tab"
        :class="{ 'mobile-tab--active': route.path === item.to }"
      >
        <component :is="item.icon" :size="22" />
        <span class="mobile-tab__label">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
/* ── Desktop nav ─────────────────────────────────────────── */
.desktop-nav {
  display: none;
  border-bottom: 1px solid var(--border-color);
  background: var(--background-card);
}

.desktop-nav__inner {
  max-width: var(--content-width-xl);
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  gap: 0.25rem;
}

.desktop-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.875rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  border-bottom: 2px solid transparent;
  transition: color var(--transition-base), border-color var(--transition-base);
  white-space: nowrap;
  text-decoration: none;
  margin-bottom: -1px; /* перекрываем border-bottom родителя */
}

.desktop-tab:hover {
  color: var(--text-primary);
}

.desktop-tab--active {
  color: var(--primary-500);
  border-bottom-color: var(--primary-500);
}

/* ── Mobile nav ──────────────────────────────────────────── */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  background: var(--background-card);
  border-top: 1px solid var(--border-color);
  /* iOS safe area */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}

.mobile-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.625rem 0.25rem;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color var(--transition-base);
  -webkit-tap-highlight-color: transparent;
}

.mobile-tab:active {
  opacity: 0.7;
}

.mobile-tab--active {
  color: var(--primary-500);
}

.mobile-tab__label {
  font-size: 0.625rem;
  font-weight: var(--font-medium);
  letter-spacing: 0.01em;
}

/* ── Breakpoints ─────────────────────────────────────────── */
@media (min-width: 641px) {
  .desktop-nav {
    display: block;
  }
}

@media (max-width: 640px) {
  .mobile-nav {
    display: flex;
  }
}
</style>
