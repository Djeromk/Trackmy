<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { BookOpen, Film, Gamepad2 } from "lucide-vue-next";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
import type { MediaType, MediaStatus, ExternalMovie, ExternalBook, ExternalGame, UserMedia } from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();

const isSearchModalOpen = ref(false);
const selectedMediaType = ref<MediaType>("other");
const notification = ref<{ message: string; type: "success" | "error" } | null>(null);

const ActivityCard = defineAsyncComponent({
  loader: () => import("@/components/dashboard/ActivityCard.vue"),
});
const MediaTypeCard = defineAsyncComponent({
  loader: () => import("@/components/dashboard/MediaTypeCard.vue"),
});
const SearchModal = defineAsyncComponent({
  loader: () => import("@/components/search/SearchModal.vue"),
});

onMounted(() => {
  if (authStore.user) {
    mediaStore.fetchUserMedia();
  }
});

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

  return mediaStore.userMedia.filter((item: UserMedia) => {
    if (item.status !== "completed") return false;
    const rawDate = item.completed_at ?? item.updatedAt;
    if (!rawDate) return false;
    const completedMs = new Date(rawDate).getTime();
    if (isNaN(completedMs)) return false;
    return completedMs >= weekAgoMs;
  }).length;
});

const activityStats = computed(() => ({
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

const scrollPosition = ref(0);

function openSearchModal(type: MediaType) {
  scrollPosition.value = window.scrollY || document.documentElement.scrollTop;
  selectedMediaType.value = type;
  isSearchModalOpen.value = true;
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.top = `-${scrollPosition.value}px`;
}

function closeSearchModal() {
  isSearchModalOpen.value = false;
  document.body.style.overflow = "auto";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.top = "";
  window.scrollTo(0, scrollPosition.value);
}

async function handleMediaSelect(
  item: ExternalMovie | ExternalBook | ExternalGame,
  status: MediaStatus
) {
  if (!authStore.isAuthenticated) {
    showNotification("Войдите в аккаунт, чтобы сохранять медиа", "error");
    return;
  }

  const result = await mediaStore.addMediaFromExternal(item, selectedMediaType.value, status);

  showNotification(
    result.success
      ? result.message || "Медиа успешно добавлено!"
      : result.error || "Ошибка при добавлении медиа",
    result.success ? "success" : "error"
  );
}

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => (notification.value = null), 3000);
}
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">
    <div class="container-xl px-6 py-8">
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

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-(--text-primary) mb-1">
          Статистика
        </h1>
        <p class="text-sm text-(--text-tertiary)">
          Отслеживайте свой прогресс по всем категориям
        </p>
      </div>

      <!-- Stats Grid -->
      <div v-if="authStore.user" class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- Activity Card - full version with chart -->
        <ActivityCard
          :books-stats="activityStats.booksStats"
          :movies-stats="activityStats.moviesStats"
          :games-stats="activityStats.gamesStats"
          :this-week-completed="activityStats.thisWeekCompleted"
        />

        <!-- Media Type Cards -->
        <MediaTypeCard
          title="Книги"
          :icon="BookOpen"
          :stats="stats.books"
          variant="books"
          @add="() => openSearchModal('book')"
        />
        <MediaTypeCard
          title="Фильмы и Сериалы"
          :icon="Film"
          :stats="stats.movies"
          variant="movies"
          @add="() => openSearchModal('movie')"
        />
        <MediaTypeCard
          title="Игры"
          :icon="Gamepad2"
          :stats="stats.games"
          variant="games"
          @add="() => openSearchModal('game')"
        />
      </div>

      <!-- Search Modal -->
      <SearchModal
        v-if="isSearchModalOpen"
        :media-type="selectedMediaType"
        @close="closeSearchModal"
        @select="handleMediaSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.grid > * {
  animation: slideIn var(--transition-slower) ease-out;
}

.grid > *:nth-child(1) {
  animation-delay: 0ms;
}

.grid > *:nth-child(2) {
  animation-delay: 100ms;
}

.grid > *:nth-child(3) {
  animation-delay: 150ms;
}

.grid > *:nth-child(4) {
  animation-delay: 200ms;
}

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
