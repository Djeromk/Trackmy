<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import type { Component } from "vue";

interface CategoryStats {
  total: number;
  backlog: number;
  inProgress: number;
  completed: number;
  dropped: number;
}

interface Props {
  title: string;
  icon: Component;
  stats: CategoryStats;
  variant: "books" | "movies" | "games";
}

interface Emits {
  (e: "add"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const completionRate = computed(() => {
  if (props.stats.total === 0) return 0;
  return Math.round((props.stats.completed / props.stats.total) * 100);
});

const accentColor = computed(() => `var(--category-${props.variant}-bg)`);
const borderClass = computed(() => `${props.variant}-card`);
</script>

<template>
  <div class="category-card" :class="borderClass">

    <!-- ── Шапка ───────────────────────────────────────────────── -->
    <div class="flex items-start justify-between mb-5">
      <div class="flex items-center gap-3">
        <component
          :is="icon"
          :size="26"
          :style="{ color: accentColor }"
          class="shrink-0"
        />
        <div>
          <h4 class="text-lg font-semibold text-(--text-primary) leading-tight">
            {{ title }}
          </h4>
          <p class="text-xs text-(--text-tertiary) mt-0.5">
            {{ stats.total }} {{ stats.total === 1 ? "элемент" : "элементов" }}
          </p>
        </div>
      </div>

      <button
        @click="emit('add')"
        class="flex text-(--text-primary) items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-(--transition-base) shrink-0"
        :style="{
          border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
        }"
      >
        <Plus :size="15" />
        Добавить
      </button>
    </div>

    <!-- ── Статистика + Прогресс-бар ─────────────────────────── -->
    <div v-if="stats.total > 0" class="stats-body">

      <!-- Левая часть: крупное «Завершено» + прогресс-бар -->
      <div class="stats-left">
        <div
          class="stats-main-value"
          :style="{ color: accentColor }"
        >
          {{ stats.completed }}
        </div>
        <div class="stats-main-label">Завершено</div>

        <!-- Прогресс-бар -->
        <div class="progress-wrap">
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${completionRate}%`, backgroundColor: accentColor }"
            />
          </div>
          <span class="progress-pct" :style="{ color: accentColor }">
            {{ completionRate }}%
          </span>
        </div>
      </div>

      <!-- Вертикальный разделитель -->
      <div class="stats-divider" />

      <!-- Правая часть: вторичные метрики -->
      <div class="stats-right">
        <div class="secondary-stat">
          <span class="secondary-value">{{ stats.inProgress }}</span>
          <span class="secondary-label">В процессе</span>
        </div>
        <div class="secondary-stat">
          <span class="secondary-value">{{ stats.backlog }}</span>
          <span class="secondary-label">Бэклог</span>
        </div>
      </div>

    </div>

    <!-- Брошено — только если есть -->
    <div
      v-if="stats.dropped > 0"
      class="flex items-center justify-between mt-3 pt-3 border-t border-(--border-color-subtle)"
    >
      <span class="text-xs text-(--text-tertiary)">Брошено</span>
      <span class="text-xs font-medium text-(--status-dropped-text)">
        {{ stats.dropped }}
      </span>
    </div>

    <!-- ── Пустое состояние ────────────────────────────────────── -->
    <div v-if="stats.total === 0" class="pt-2 text-center">
      <component :is="icon" :size="28" class="mx-auto mb-3 text-(--text-disabled)" />
      <p class="text-sm text-(--text-tertiary) mb-3">Список пуст</p>
      <button @click="emit('add')" class="btn-secondary text-sm">
        Добавить первый
      </button>
    </div>

  </div>
</template>

<style scoped>
/* Stats layout */
.stats-body {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0;
}

/* Left: main completed metric */
.stats-left {
  flex: 1;
  min-width: 0;
}

.stats-main-value {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  margin-bottom: 0.25rem;
}

.stats-main-label {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.875rem;
}

/* Progress bar */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-track {
  flex: 1;
  height: 5px;
  border-radius: 9999px;
  background-color: var(--border-color);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-pct {
  font-size: 0.6875rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Vertical divider */
.stats-divider {
  width: 1px;
  height: 4rem;
  background-color: var(--border-color);
  margin: 0 1.25rem;
  flex-shrink: 0;
}

/* Right: secondary metrics */
.stats-right {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  flex-shrink: 0;
}

.secondary-stat {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.secondary-value {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.secondary-label {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .category-card {
    padding: 1rem;
  }

  .stats-main-value {
    font-size: 2.5rem;
  }

  .stats-divider {
    margin: 0 1rem;
  }
}
</style>
