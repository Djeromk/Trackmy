<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { Trophy, TrendingUp } from "lucide-vue-next";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

/**
 * Статистика по одной категории медиа.
 * completed — завершённые, total — всего в списке.
 */
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

/** Ссылка на DOM-элемент контейнера графика */
const chartContainer = ref<HTMLElement | null>(null);

/** Экземпляр ECharts — null пока график не инициализирован */
let chartInstance: echarts.ECharts | null = null;

/** Суммарное количество завершённых по всем категориям */
const totalCompleted = computed(() =>
  props.booksStats.completed +
  props.moviesStats.completed +
  props.gamesStats.completed
);

/** Суммарное количество элементов по всем категориям */
const totalItems = computed(() =>
  props.booksStats.total +
  props.moviesStats.total +
  props.gamesStats.total
);

/**
 * Процент завершения от общего количества.
 * Округляем до целого — дробные проценты не нужны в KPI.
 */
const completionPercentage = computed(() => {
  if (totalItems.value === 0) return 0;
  return Math.round((totalCompleted.value / totalItems.value) * 100);
});

/**
 * Цвета категорий синхронизированы с CSS-переменными темы.
 * Используем getComputedStyle чтобы читать актуальные значения
 * переменных после монтирования (нужно для смены тем в будущем).
 */
const CATEGORY_COLORS = {
  books:  "#527575",   // --category-books-bg
  movies: "#d87943",   // --category-movies-bg
  games:  "#7c5cbf",   // --category-games-bg
};

/**
 * Данные для диаграммы — фильтруем категории с нулём завершённых,
 * чтобы не показывать пустые сегменты.
 */
const chartData = computed(() => [
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
].filter((item) => item.value > 0));

/**
 * Опции ECharts для кольцевой диаграммы.
 *
 * Ключевые решения:
 * - radius: ["62%", "88%"] — широкое кольцо, хорошо видна дуга
 * - startAngle: 90 — начало сверху (12 часов), естественно для прогресса
 * - borderRadius: 6 — скруглённые сегменты, современный вид
 * - emphasis.scale: false — без скачка при hover, стабильнее
 */
const getChartOption = (): EChartsOption => ({
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c} ({d}%)",
    backgroundColor: "var(--background-card)",
    borderColor: "var(--border-color)",
    borderWidth: 1,
    textStyle: {
      color: "var(--text-primary)",
      fontSize: 12,
    },
    padding: [8, 12],
  },
  legend: {
    show: false,
  },
  series: [
    {
      name: "Завершено",
      type: "pie",
      radius: ["62%", "88%"],
      center: ["50%", "50%"],
      data: chartData.value,
      itemStyle: {
        borderRadius: 3,
        borderColor: "var(--background-card)",
        borderWidth: 1,
      },
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

onMounted(() => { initChart(); });

watch(
  () => [props.booksStats, props.moviesStats, props.gamesStats],
  () => { updateChart(); },
  { deep: true }
);

onUnmounted(() => { cleanup(); });
</script>

<template>
  <div class="card-padded border-l-4 border-l-(--primary-500)">

    <!-- ── Заголовок ───────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-(--primary-500) flex items-center justify-center shadow-(--shadow-sm)">
          <Trophy :size="20" class="text-white" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-(--text-primary) leading-tight">
            Моя активность
          </h3>
          <p class="text-xs text-(--text-tertiary)">
            {{ totalCompleted }} из {{ totalItems }} завершено
          </p>
        </div>
      </div>

      <!--
        Чип «+N на этой неделе» — зелёный позитивный индикатор.
        Показываем только если есть завершённые за неделю.
        Намеренно компактный: не конкурирует с главным KPI.
      -->
      <div
        v-if="thisWeekCompleted > 0"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        style="background-color: var(--status-completed-bg); color: var(--status-completed-text); border: 1px solid var(--status-completed-border);"
      >
        <TrendingUp :size="12" />
        +{{ thisWeekCompleted }} за неделю
      </div>
    </div>

    <!-- ── Главный KPI: процент ────────────────────────────────── -->
    <!--
      Процент — главный элемент карточки.
      Крупная цифра + подпись + горизонтальный прогресс-бар.
      Прогресс-бар показывает то же значение визуально.
    -->
    <div class="mb-6">
      <div class="flex items-end gap-3 mb-3">
        <span
          class="text-7xl font-extrabold leading-none tracking-tight"
          style="color: var(--primary-500);"
        >
          {{ completionPercentage }}%
        </span>
        <span class="text-sm text-(--text-tertiary) mb-2 leading-tight">
          общий<br>прогресс
        </span>
      </div>

      <!-- Прогресс-бар — широкий, с акцентным цветом -->
      <div class="w-full h-2.5 rounded-full overflow-hidden" style="background-color: var(--border-color);">
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          style="background-color: var(--primary-500);"
          :style="{ width: `${completionPercentage}%` }"
        />
      </div>
    </div>

    <!-- ── Диаграмма + статистика по категориям ───────────────── -->
    <div v-if="totalCompleted > 0" class="flex items-center gap-4">

      <!--
        Кольцевая диаграмма ECharts.
        Квадратный контейнер — диаграмма сама центрируется внутри.
        h-32 w-32 — достаточно для читаемости кольца.
      -->
      <div ref="chartContainer" class="w-32 h-32 shrink-0" />

      <!-- Легенда: три строки, иконка-точка + название + счётчик -->
      <div class="flex flex-col gap-2 flex-1 min-w-0">

        <!-- Книги -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: CATEGORY_COLORS.books }"
            />
            <span class="text-sm text-(--text-secondary) truncate">Книги</span>
          </div>
          <span class="text-sm font-semibold text-(--text-primary) shrink-0">
            {{ booksStats.completed }}
            <span class="font-normal text-(--text-tertiary)">/ {{ booksStats.total }}</span>
          </span>
        </div>

        <!-- Фильмы -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: CATEGORY_COLORS.movies }"
            />
            <span class="text-sm text-(--text-secondary) truncate">Фильмы</span>
          </div>
          <span class="text-sm font-semibold text-(--text-primary) shrink-0">
            {{ moviesStats.completed }}
            <span class="font-normal text-(--text-tertiary)">/ {{ moviesStats.total }}</span>
          </span>
        </div>

        <!-- Игры -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: CATEGORY_COLORS.games }"
            />
            <span class="text-sm text-(--text-secondary) truncate">Игры</span>
          </div>
          <span class="text-sm font-semibold text-(--text-primary) shrink-0">
            {{ gamesStats.completed }}
            <span class="font-normal text-(--text-tertiary)">/ {{ gamesStats.total }}</span>
          </span>
        </div>

      </div>
    </div>

    <!-- ── Пустое состояние ────────────────────────────────────── -->
    <div v-if="totalCompleted === 0" class="text-center py-6">
      <div class="w-14 h-14 mx-auto rounded-full bg-(--background-subtle) flex items-center justify-center mb-3">
        <Trophy :size="22" class="text-(--text-disabled)" />
      </div>
      <p class="text-sm text-(--text-tertiary)">
        Пока нет завершённых элементов
      </p>
    </div>

  </div>
</template>

<style scoped>
canvas { outline: none; }
</style>
