<script setup lang="ts">
import { computed } from "vue";
import { Trophy, TrendingUp, PlayCircle } from "lucide-vue-next";
import { useRouter } from "vue-router";

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

const router = useRouter();

const totalCompleted = computed(
  () =>
    props.booksStats.completed +
    props.moviesStats.completed +
    props.gamesStats.completed
);

const totalInProgress = computed(
  () =>
    props.booksStats.total -
    props.booksStats.completed +
    (props.moviesStats.total - props.moviesStats.completed) +
    (props.gamesStats.total - props.gamesStats.completed)
);

const totalItems = computed(
  () => props.booksStats.total + props.moviesStats.total + props.gamesStats.total
);

function goToStats() {
  router.push("/stats");
}
</script>

<template>
  <div
    class="card-padded flex items-center justify-between gap-4 cursor-pointer hover:bg-(--background-hover) transition-colors"
    @click="goToStats"
  >
    <!-- Stats row -->
    <div class="flex items-center gap-6 flex-wrap">
      <!-- Completed -->
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          style="background-color: var(--status-completed-bg)"
        >
          <Trophy :size="16" style="color: var(--status-completed-text)" />
        </div>
        <div>
          <div class="text-lg font-bold text-(--text-primary) leading-tight">
            {{ totalCompleted }}
          </div>
          <div class="text-xs text-(--text-tertiary)">завершено</div>
        </div>
      </div>

      <!-- In Progress -->
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          style="background-color: var(--status-progress-bg)"
        >
          <PlayCircle :size="16" style="color: var(--status-progress-text)" />
        </div>
        <div>
          <div class="text-lg font-bold text-(--text-primary) leading-tight">
            {{ totalInProgress }}
          </div>
          <div class="text-xs text-(--text-tertiary)">в процессе</div>
        </div>
      </div>

      <!-- This week -->
      <div
        v-if="thisWeekCompleted > 0"
        class="flex items-center gap-2"
      >
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          style="background-color: var(--primary-100)"
        >
          <TrendingUp :size="16" style="color: var(--primary-500)" />
        </div>
        <div>
          <div class="text-lg font-bold text-(--text-primary) leading-tight">
            +{{ thisWeekCompleted }}
          </div>
          <div class="text-xs text-(--text-tertiary)">за неделю</div>
        </div>
      </div>
    </div>

    <!-- Link to full stats -->
    <div class="text-xs text-(--text-link) font-medium shrink-0">
      Подробнее
    </div>
  </div>
</template>
