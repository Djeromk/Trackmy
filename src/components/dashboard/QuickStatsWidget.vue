<script setup lang="ts">
import { computed } from "vue";
import { Trophy, TrendingUp, PlayCircle } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

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
const authStore = useAuthStore();

const userName = computed(() => {
  return authStore.userName || authStore.userEmail?.split("@")[0] || "Друг";
});

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

// const totalItems = computed(
//   () => props.booksStats.total + props.moviesStats.total + props.gamesStats.total
// );

function goToStats() {
  router.push("/stats");
}
</script>

<template>
  <div
    class="hero-stats-section mb-8 cursor-pointer hover:shadow-(--shadow-md) transition-all"
    @click="goToStats"
  >
    <!-- Hero Header with Greeting -->
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-(--text-primary) mb-2">
        Привет, {{ userName }}!
      </h2>
      <p class="text-sm text-(--text-secondary)">
        Твой прогресс за неделю
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <!-- Completed -->
      <div class="stat-card">
        <div
          class="stat-icon"
          style="background-color: var(--status-completed-bg)"
        >
          <Trophy :size="20" style="color: var(--status-completed-text)" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalCompleted }}</div>
          <div class="stat-label">завершено</div>
        </div>
      </div>

      <!-- In Progress -->
      <div class="stat-card">
        <div
          class="stat-icon"
          style="background-color: var(--status-progress-bg)"
        >
          <PlayCircle :size="20" style="color: var(--status-progress-text)" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalInProgress }}</div>
          <div class="stat-label">в процессе</div>
        </div>
      </div>

      <!-- This week -->
      <div v-if="thisWeekCompleted > 0" class="stat-card stat-card--highlight">
        <div
          class="stat-icon"
          style="background-color: var(--primary-100)"
        >
          <TrendingUp :size="20" style="color: var(--primary-500)" />
        </div>
        <div class="stat-content">
          <div class="stat-value">+{{ thisWeekCompleted }}</div>
          <div class="stat-label">за неделю</div>
        </div>
      </div>
    </div>

    <!-- Link to full stats -->
    <div class="mt-4 text-center">
      <span class="text-sm text-(--text-link) font-medium hover:underline">
        Подробная статистика →
      </span>
    </div>
  </div>
</template>

<style scoped>
.hero-stats-section {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--background-surface) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--background-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card--highlight {
  border-color: var(--primary-300);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--background-surface) 100%);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
}

@media (max-width: 640px) {
  .hero-stats-section {
    padding: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-card {
    padding: 0.875rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
