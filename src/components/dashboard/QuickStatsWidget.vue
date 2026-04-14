<script setup lang="ts">
import { computed } from "vue";
import { Trophy, TrendingUp } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMediaStore } from "@/stores/media";

interface CategoryStats {
  completed: number;
  total: number;
}

interface Props {
  booksStats: CategoryStats;
  moviesStats: CategoryStats;
  gamesStats: CategoryStats;
  thisWeekCompleted?: number;
  inProgressCovers?: (string | null)[];
}

const props = withDefaults(defineProps<Props>(), {
  thisWeekCompleted: 0,
  inProgressCovers: () => [],
});

const router = useRouter();
const authStore = useAuthStore();
const mediaStore = useMediaStore();

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
    mediaStore.stats.movies.inProgress +
    mediaStore.stats.books.inProgress +
    mediaStore.stats.games.inProgress
);

const validCovers = computed(() =>
  props.inProgressCovers.filter((c): c is string => !!c)
);

function goToStats() {
  router.push("/stats");
}
</script>

<template>
  <div
    class="hero-stats-container mb-8 cursor-pointer"
    @click="goToStats"
  >
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

      <!-- Left: Greeting -->
      <div class="shrink-0">
        <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-(--text-primary)">
          Привет,{{ userName }}!
        </h2>
        <p class="text-sm text-(--text-tertiary) mt-1">
          Твой прогресс за неделю
        </p>
      </div>

      <!-- Right: Stats Row with Dividers -->
      <div class="stats-row">

        <!-- Stat: Completed -->
        <div class="stat-item">
          <Trophy :size="26" class="stat-icon stat-icon--completed" />
          <div class="stat-text">
            <span class="stat-value">{{ totalCompleted }}</span>
            <span class="stat-label">завершено</span>
          </div>
        </div>

        <div class="stat-divider" />

        <!-- Stat: In Progress with stacked covers -->
        <div class="stat-item">
          <!-- Stacked mini covers if available, fallback to count only -->
          <div v-if="validCovers.length > 0" class="hidden md:block covers-stack">
            <img
              v-for="(cover, i) in validCovers"
              :key="i"
              :src="cover"
              :alt="`Обложка ${i + 1}`"
              class="cover-avatar"
              :style="{ zIndex: validCovers.length - i, left: `${i * 18}px` }"
            />
          </div>
          <div class="stat-text">
            <span class="stat-value stat-value--progress">{{ totalInProgress }}</span>
            <span class="stat-label">в процессе</span>
          </div>
        </div>

        <!-- Stat: This week (conditional) -->
        <template v-if="thisWeekCompleted > 0">
          <div class="stat-divider" />
          <div class="stat-item">
            <TrendingUp :size="26" class="stat-icon stat-icon--week" />
            <div class="stat-text">
              <span class="stat-value">+{{ thisWeekCompleted }}</span>
              <span class="stat-label">за неделю</span>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-stats-container {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--background-card) 60%);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: 1.5rem 2rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.hero-stats-container:hover {
  box-shadow: var(--shadow-md);
}

/* Stats row */
.stats-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.stat-divider {
  width: 1px;
  height: 2.5rem;
  background-color: var(--border-color);
  margin: 0 1.25rem;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Icons */
.stat-icon {
  flex-shrink: 0;
}

.stat-icon--completed {
  color: var(--secondary-500);
}

.stat-icon--week {
  color: var(--primary-500);
}

/* Text */
.stat-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.stat-value--progress {
  color: var(--primary-500);
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  text-transform: lowercase;
}

/* Stacked covers */
.covers-stack {
  position: relative;
  width: calc(18px * 2 + 42px); /* 3 avatars overlapping */
  height: 56px;
  flex-shrink: 0;
}

.cover-avatar {
  position: absolute;
  top: 0;
  width: 42px;
  height: 56px;
  border-radius: 4px;
  object-fit: cover;
  border: 2px solid var(--background-card);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 640px) {
  .hero-stats-container {
    padding: 1.25rem 1.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-divider {
    margin: 0 1rem;
  }
  .cover-avatar {
    width: 32px;
    height: 42px;
  }
  .covers-stack {
    width: calc(18px * 2 + 32px);
    height: 42px;
  }
}
</style>
