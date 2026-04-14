<script setup lang="ts">
import InProgressHero from "@/components/dashboard/InProgressHero.vue";
import QuickStatsWidget from "@/components/dashboard/QuickStatsWidget.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
import WelcomeCTA from "@/components/dashboard/WelcomeCTA.vue";
import SkeletonLoader from "@/components/skeleton/SkeletonLoader.vue";
import FeaturedBlock from "@/components/featured/FeaturedBlock.vue";
import type { MediaStatus, UserMedia } from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();
const router = useRouter();

const notification = ref<{ message: string; type: "success" | "error" } | null>(
  null
);
let loading = ref(true);

onMounted(() => {
  loading.value = false;
  if (authStore.user) {
    mediaStore.fetchUserMedia();
  }
});

const inProgressItems = computed(() =>
  mediaStore.userMedia.filter((item) => item.status === "in_progress")
);

const stats = computed(() => mediaStore.stats);

/**
 * Counts media completed in the last 7 days.
 */
const thisWeekCompleted = computed<number>(() => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoMs = weekAgo.getTime();
  const result = mediaStore.userMedia.filter((item: UserMedia) => {
    if (item.status !== "completed") return false;
    const rawDate = item.completed_at ?? item.updatedAt;
    if (!rawDate) return false;
    const completedMs = new Date(rawDate).getTime();
    if (isNaN(completedMs)) return false;
    return completedMs >= weekAgoMs;
  })
  return result.length;
});

const quickStats = computed(() => ({
  booksStats: {
    completed: stats.value.books.completed,
    total: stats.value.books.total,
  },
  moviesStats: {
    completed: stats.value.movies.completed,
    total: stats.value.movies.total,
  },
  gamesStats: {
    completed: stats.value.games.completed,
    total: stats.value.games.total,
  },
  thisWeekCompleted: thisWeekCompleted.value,
}));

async function handleStatusUpdate(id: string, status: MediaStatus) {
  const updates = {
    status,
    is_finished: status === "completed",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const result = await mediaStore.updateMedia(id, updates);

  showNotification(
    result.success
      ? "Статус успешно обновлён!"
      : result.error || "Ошибка при обновлении статуса",
    result.success ? "success" : "error"
  );
}

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => (notification.value = null), 3000);
}

function handleUpdateStatus(id: string, status: MediaStatus) {
  handleStatusUpdate(id, status);
}

function handleViewAllInProgress() {
  router.push("/library");
}
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">
    <SkeletonLoader v-if="loading" />
    <div v-else class="container-xl px-6 py-8">
      <!-- Notification -->
      <Transition name="slide-down">
        <div
          v-if="notification"
          :class="[
            'fixed top-20 right-4 z-50 card-padded px-6 py-4 max-w-md',
            notification.type === 'success'
              ? 'border-l-4 border-green-500'
              : 'border-l-4 border-red-500',
          ]"
        >
          <p
            :class="
              notification.type === 'success'
                ? 'text-green-700'
                : 'text-red-700'
            "
          >
            {{ notification.message }}
          </p>
        </div>
      </Transition>

      <!-- Welcome CTA for non-authenticated users -->
      <WelcomeCTA v-if="!authStore.user" />

      <!-- Quick Stats Hero (moved to top) -->
      <QuickStatsWidget
        v-if="authStore.user && mediaStore.userMedia.length > 0"
        :books-stats="quickStats.booksStats"
        :movies-stats="quickStats.moviesStats"
        :games-stats="quickStats.gamesStats"
        :this-week-completed="quickStats.thisWeekCompleted"
        :in-progress-covers="inProgressItems.slice(0, 3).map(i => i.media?.cover_url || null)"
      />

      <!-- Hero: In Progress -->
      <InProgressHero
        v-if="authStore.isAuthenticated"
        :items="inProgressItems"
        @update-status="handleUpdateStatus"
        @view-all="handleViewAllInProgress"
      />

      <!-- Featured Block -->
      <FeaturedBlock class="mb-8" />
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
