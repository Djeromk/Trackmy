<script setup lang="ts">
/**
 * NotFoundPage — страница 404.
 *
 * Показывается когда пользователь попал на несуществующий маршрут.
 * Подключается в router/index.ts через catchAll роут: { path: '/:pathMatch(.*)*' }
 *
 * Содержит:
 * - Большую цифру "404" как визуальный якорь
 * - Понятное объяснение что произошло
 * - Кнопку "На главную" как основное действие
 * - Кнопку "Назад" если есть история навигации
 * - Подсказку с неправильным путём чтобы пользователь понял ошибку
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Home, ArrowLeft, Search } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

/**
 * Показываем кнопку "Назад" только если есть история навигации.
 * window.history.length > 1 означает что пользователь переходил
 * между страницами, а не открыл эту ссылку напрямую.
 */
const canGoBack = computed(() => window.history.length > 1)

/**
 * Путь, который не был найден — показываем пользователю
 * чтобы он понял где ошибка (опечатка в URL и т.д.)
 */
const notFoundPath = computed(() => route.path)

function goHome(): void {
  router.push('/')
}

function goBack(): void {
  router.back()
}
</script>

<template>
  <div class="not-found-page" role="main" aria-labelledby="not-found-title">

    <!-- Фоновые декоративные элементы — большие прозрачные цифры -->
    <div class="not-found-bg" aria-hidden="true">
      <span class="not-found-bg-number">4</span>
      <span class="not-found-bg-number">0</span>
      <span class="not-found-bg-number">4</span>
    </div>

    <!-- Основной контент -->
    <div class="not-found-content">

      <!-- Иконка -->
      <div class="not-found-icon-wrapper">
        <Search :size="28" class="not-found-icon" aria-hidden="true" />
      </div>

      <!-- Заголовок -->
      <h1 id="not-found-title" class="not-found-title">
        Страница не найдена
      </h1>

      <!-- Описание -->
      <p class="not-found-description">
        Страница, которую вы ищете, не существует или была перемещена.
      </p>

      <!--
        Показываем конкретный путь только если он информативен
        (не просто "/"). Помогает пользователю найти опечатку.
      -->
      <div v-if="notFoundPath !== '/'" class="not-found-path" aria-label="Запрошенный путь">
        <code>{{ notFoundPath }}</code>
      </div>

      <!-- Кнопки действий -->
      <div class="not-found-actions">
        <button
          class="not-found-btn not-found-btn--primary"
          @click="goHome"
          autofocus
        >
          <Home :size="16" aria-hidden="true" />
          <span>На главную</span>
        </button>

        <button
          v-if="canGoBack"
          class="not-found-btn not-found-btn--secondary"
          @click="goBack"
        >
          <ArrowLeft :size="16" aria-hidden="true" />
          <span>Вернуться назад</span>
        </button>
      </div>

      <!-- Подсказка -->
      <p class="not-found-hint">
        Если вы уверены что ссылка должна работать — возможно она устарела.
      </p>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--background-body);
  overflow: hidden;
}

/* ── Фоновые декоративные цифры ──────────────────────── */
.not-found-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  pointer-events: none;
  user-select: none;
}

.not-found-bg-number {
  font-size: clamp(14rem, 30vw, 28rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;

  /*
    Используем gradient + clip для "прозрачного" текста.
    Цвет берём из primary палитры, но очень прозрачный —
    так цифры видны на любом фоне (светлом и тёмном).
  */
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--primary-500) 10%, transparent) 0%,
    color-mix(in srgb, var(--primary-500) 4%, transparent) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: not-found-float 6s ease-in-out infinite;
}

.not-found-bg-number:nth-child(2) {
  animation-delay: -2s;
}

.not-found-bg-number:nth-child(3) {
  animation-delay: -4s;
}

@keyframes not-found-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* ── Основной контент ────────────────────────────────── */
.not-found-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  gap: 1rem;
  /* Стеклянная карточка — полупрозрачный фон чтобы виднелись цифры сзади */
  background: color-mix(in srgb, var(--background-card) 85%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 3rem 2rem;
  border-radius: var(--border-radius-xl, 1.25rem);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

/* ── Иконка ──────────────────────────────────────────── */
.not-found-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-50);
  border: 1px solid var(--primary-200);
  margin-bottom: 0.5rem;
  animation: not-found-pulse 3s ease-in-out infinite;
}

.dark .not-found-icon-wrapper {
  background-color: var(--primary-100);
  border-color: var(--primary-300);
}

@keyframes not-found-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary-500) 20%, transparent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--primary-500) 0%, transparent); }
}

.not-found-icon {
  color: var(--primary-500);
}

/* ── Тексты ──────────────────────────────────────────── */
.not-found-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: var(--font-bold, 700);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight, -0.015em);
  line-height: var(--leading-tight, 1.2);
  margin: 0;
}

.not-found-description {
  font-size: var(--text-base, 0.9375rem);
  color: var(--text-tertiary);
  line-height: var(--leading-relaxed, 1.625);
  margin: 0;
  max-width: 34ch;
}

/* Блок с путём — моноширинный стиль для URL */
.not-found-path {
  padding: 0.4rem 0.875rem;
  border-radius: var(--border-radius-base, 0.5rem);
  background-color: var(--background-subtle);
  border: 1px solid var(--border-color-subtle);
  font-size: var(--text-sm, 0.8125rem);
  color: var(--text-tertiary);
  max-width: 100%;
  overflow: hidden;
}

.not-found-path code {
  font-family: var(--font-mono, monospace);
  word-break: break-all;
}

.not-found-hint {
  font-size: var(--text-xs, 0.6875rem);
  color: var(--text-disabled);
  margin: 0;
  margin-top: 0.25rem;
}

/* ── Кнопки ──────────────────────────────────────────── */
.not-found-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}

.not-found-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--border-radius-base, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all 150ms ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.not-found-btn:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

.not-found-btn--primary {
  background-color: var(--primary-500);
  color: white;
  box-shadow: var(--shadow-sm);
}

.not-found-btn--primary:hover {
  background-color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.not-found-btn--primary:active {
  transform: translateY(0);
}

.not-found-btn--secondary {
  background-color: var(--background-card);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.not-found-btn--secondary:hover {
  background-color: var(--background-hover);
  border-color: var(--border-color-strong);
}

/* ── Адаптив ─────────────────────────────────────────── */
@media (max-width: 480px) {
  .not-found-content {
    padding: 2rem 1.25rem;
  }

  .not-found-actions {
    flex-direction: column;
    width: 100%;
  }

  .not-found-btn {
    justify-content: center;
    width: 100%;
  }
}
</style>
