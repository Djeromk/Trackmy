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
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-(--shadow-xs)"
          :style="{ backgroundColor: accentColor }"
        >
          <component :is="icon" :size="22" class="text-white" />
        </div>
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
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-(--transition-base) shrink-0"
        :style="{
          backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          color: accentColor,
          border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
        }"
      >
        <Plus :size="15" />
        Добавить
      </button>
    </div>

    <!-- ── Статистика ──────────────────────────────────────────── -->
    <!--
      Асимметричная сетка: левая колонка — крупная метрика «В процессе»,
      правая — две вторичные метрики (завершено + бэклог) стопкой.
      row-span-2 на левой ячейке растягивает её на обе строки правой.
    -->
    <div class="grid grid-cols-2 gap-3 mb-5" v-if="stats.total > 0">

      <!-- В процессе — главная метрика, занимает всю левую колонку -->
      <div
        class="row-span-2 rounded-xl p-4 flex flex-col justify-center"

      >
        <div
          class="text-5xl font-extrabold leading-none mb-2 tracking-tight"
          :style="{ color: accentColor }"
        >
          {{ stats.inProgress }}
        </div>
        <div class="text-xs font-medium text-(--text-tertiary)">В процессе</div>
      </div>

      <!-- Завершено — правая верхняя ячейка -->
      <div
        class="rounded-xl p-3"

      >
        <div class="text-2xl font-bold leading-none mb-1 text-(--status-completed-text)">
          {{ stats.completed }}
        </div>
        <div class="text-xs text-(--text-tertiary)">Завершено</div>
      </div>

      <!-- Бэклог — правая нижняя ячейка -->
      <div
        class="rounded-xl p-3"

      >
        <div class="text-2xl font-bold leading-none mb-1 text-(--text-secondary)">
          {{ stats.backlog }}
        </div>
        <div class="text-xs text-(--text-tertiary)">Бэклог</div>
      </div>

    </div>

    <!-- ── Прогресс-бар ────────────────────────────────────────── -->
    <div v-if="stats.total > 0">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs text-(--text-tertiary)">Завершено</span>
        <span class="text-xs font-semibold text-(--text-secondary)">
          {{ completionRate }}%
        </span>
      </div>
      <div
        class="w-full h-1.5 rounded-full overflow-hidden"
        style="background-color: var(--border-color);"
      >
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{
            width: `${completionRate}%`,
            backgroundColor: accentColor,
          }"
        />
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
