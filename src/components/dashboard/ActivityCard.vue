<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { Trophy, TrendingUp } from "lucide-vue-next";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

interface CategoryStats {
  completed: number;
  total: number;
}

interface Props {
  booksStats: CategoryStats;
  moviesStats: CategoryStats;
  gamesStats: CategoryStats;
  thisWeekCompleted?: number;
}

const props = withDefaults(defineProps<Props>(), {
  thisWeekCompleted: 0,
});

const chartContainer = ref<HTMLElement | null>(null);

let chartInstance: echarts.ECharts | null = null;

const totalCompleted = computed(
  () =>
    props.booksStats.completed +
    props.moviesStats.completed +
    props.gamesStats.completed,
);

const totalItems = computed(
  () =>
    props.booksStats.total + props.moviesStats.total + props.gamesStats.total,
);

const completionPercentage = computed(() => {
  if (totalItems.value === 0) return 0;
  return Math.round((totalCompleted.value / totalItems.value) * 100);
});

const CATEGORY_COLORS = {
  books: "#527575", // --category-books-bg
  movies: "#d87943", // --category-movies-bg
  games: "#7c5cbf", // --category-games-bg
};

const chartData = computed(() =>
  [
    {
      value: props.booksStats.completed,
      name: "Книги",
      itemStyle: { color: CATEGORY_COLORS.books },
    },
    {
      value: props.moviesStats.completed,
      name: "Фильмы",
      itemStyle: { color: CATEGORY_COLORS.movies },
    },
    {
      value: props.gamesStats.completed,
      name: "Игры",
      itemStyle: { color: CATEGORY_COLORS.games },
    },
  ].filter((item) => item.value > 0),
);

const getChartOption = (): EChartsOption => ({
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c} ({d}%)",
    backgroundColor: "var(--background-card)",
    borderColor: "var(--border-color)",
    borderWidth: 0,
    confine: true,
    textStyle: {
      color: "var(--text-primary)",
      fontSize: 12,
    },
    padding: [8, 12],
  },
  legend: {
    show: false,
  },
  graphic: [
    {
      type: "group",
      left: "center",
      top: "center",
      children: [
        {
          type: "text",
          left: "center",
          top: 0,
          style: {
            text: `${completionPercentage.value}%`,
            fill: "#e78a53",
            font: "36px 'Geist Mono', ui-monospace, monospace",
          },
        },
        {
          type: "text",
          left: "center",
          top: 35,
          style: {
            text: "Завершено",
            fill: "#e78a53",
            font: "12px 'Geist Mono', ui-monospace, monospace",
          },
        },
      ],
    },
  ],
  series: [
    {
      name: "Завершено",
      type: "pie",
      radius: ["58%", "85%"],
      center: ["50%", "50%"],
      data: chartData.value,
      startAngle: 90,
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: false,
        itemStyle: {
          shadowBlur: 16,
          shadowOffsetX: 0,
          shadowColor: "rgba(0,0,0,0.18)",
        },
      },
      animationType: "scale",
      animationEasing: "elasticOut",
      animationDelay: (idx: number) => idx * 80,
    },
  ],
});

function initChart() {
  if (!chartContainer.value) return;
  chartInstance = echarts.init(chartContainer.value);
  chartInstance.setOption(getChartOption());
  window.addEventListener("resize", handleResize);
}

function updateChart() {
  if (!chartInstance) return;
  chartInstance.setOption(getChartOption());
}

function handleResize() {
  chartInstance?.resize();
}

function cleanup() {
  if (chartInstance) {
    window.removeEventListener("resize", handleResize);
    chartInstance.dispose();
    chartInstance = null;
  }
}

onMounted(() => {
  initChart();
});

watch(
  () => [props.booksStats, props.moviesStats, props.gamesStats],
  () => {
    updateChart();
  },
  { deep: true },
);

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div class="card-padded">
    <!-- ── Заголовок ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 flex items-center justify-center">
          <Trophy :size="24" class="text-(--primary-500)" />
        </div>
        <div>
          <h3
            class="text-base font-semibold text-(--text-primary) leading-tight"
          >
            Моя активность
          </h3>
          <p class="text-xs text-(--text-tertiary)">
            {{ totalCompleted }} из {{ totalItems }} завершено
          </p>
        </div>
      </div>

      <div
        v-if="thisWeekCompleted > 0"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        style="
          color: var(--status-completed-text);
          border: 1px solid var(--status-completed-border);
        "
      >
        <TrendingUp :size="12" />
        +{{ thisWeekCompleted }} за неделю
      </div>
    </div>

    <!-- ── Диаграмма + легенда (двухколоночный layout) ──────── -->
    <div v-if="totalCompleted > 0" class="flex items-center gap-6">
      <!-- Левая колонка: большая диаграмма с % в центре -->
      <div ref="chartContainer" class="chart-donut shrink-0" />

      <!-- Правая колонка: легенда по категориям -->
      <div class="flex flex-col gap-3 flex-1 min-w-0">
        <!-- Книги -->
        <div class="legend-row">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="legend-dot"
              :style="{ backgroundColor: CATEGORY_COLORS.books }"
            />
            <span class="text-sm text-(--text-secondary) truncate">Книги</span>
          </div>
          <span class="legend-count">
            {{ booksStats.completed }}
            <span class="legend-total">/ {{ booksStats.total }}</span>
          </span>
        </div>

        <!-- Фильмы -->
        <div class="legend-row">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="legend-dot"
              :style="{ backgroundColor: CATEGORY_COLORS.movies }"
            />
            <span class="text-sm text-(--text-secondary) truncate">Фильмы</span>
          </div>
          <span class="legend-count">
            {{ moviesStats.completed }}
            <span class="legend-total">/ {{ moviesStats.total }}</span>
          </span>
        </div>

        <!-- Игры -->
        <div class="legend-row">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="legend-dot"
              :style="{ backgroundColor: CATEGORY_COLORS.games }"
            />
            <span class="text-sm text-(--text-secondary) truncate">Игры</span>
          </div>
          <span class="legend-count">
            {{ gamesStats.completed }}
            <span class="legend-total">/ {{ gamesStats.total }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- ── Пустое состояние ────────────────────────────────────── -->
    <div v-if="totalCompleted === 0" class="text-center py-6">
      <div
        class="w-14 h-14 mx-auto rounded-full bg-(--background-subtle) flex items-center justify-center mb-3"
      >
        <Trophy :size="22" class="text-(--text-disabled)" />
      </div>
      <p class="text-sm text-(--text-tertiary)">
        Пока нет завершённых элементов
      </p>
    </div>
  </div>
</template>

<style scoped>
canvas {
  outline: none;
}

.chart-donut {
  width: 160px;
  height: 160px;
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.legend-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.legend-total {
  font-weight: 400;
  color: var(--text-tertiary);
}

@media (max-width: 640px) {
  .chart-donut {
    width: 130px;
    height: 130px;
  }

  .card-padded {
    padding: 1rem;
  }
}
</style>
