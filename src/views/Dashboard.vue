<script setup lang="ts">
import InProgressHero from "@/components/dashboard/InProgressHero.vue";

import ActivityCard from "@/components/dashboard/ActivityCard.vue";
//import MediaTypeCard from "@/components/dashboard/MediaTypeCard.vue";
import { BookOpen, Film, Gamepad2 } from "lucide-vue-next";
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
//import SearchModal from "@/components/search/SearchModal.vue";
import WelcomeCTA from "@/components/dashboard/WelcomeCTA.vue";
//import MediaAccordion from "@/components/accordion/MediaAccordion.vue";
import SkeletonLoader from "@/components/skeleton/SkeletonLoader.vue";
import type {
  MediaType,
  MediaStatus,
  UserMedia,
  ExternalMovie,
  ExternalBook,
  ExternalGame,
} from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();

const isSearchModalOpen = ref(false);
const selectedMediaType = ref<MediaType>("other");
const notification = ref<{ message: string; type: "success" | "error" } | null>(
  null,
);
let loading = ref(true)

const SearchModal = defineAsyncComponent({
  loader: () => import("@/components/search/SearchModal.vue"),
})
const MediaTypeCard = defineAsyncComponent({
  loader: () => import("@/components/dashboard/MediaTypeCard.vue"),
})
const MediaAccordion = defineAsyncComponent({
  loader: () => import("@/components/accordion/MediaAccordion.vue"),
})
onMounted(() => {
  loading.value = false
  if (authStore.user) {
    mediaStore.fetchUserMedia();
  }
});

const inProgressItems = computed(() =>
  mediaStore.userMedia.filter((item) => item.status === "in_progress"),
);

const stats = computed(() => mediaStore.stats);

/**
 * Считает количество медиа, завершённых за последние 7 дней.
 *
 * Логика:
 * 1. Берём начало текущего дня (00:00:00) и вычитаем 6 дней назад —
 *    получаем границу "неделя назад" (включая сегодня = 7 дней).
 * 2. Фильтруем userMedia по двум условиям:
 *    а) статус === 'completed'
 *    б) дата завершения (completed_at) попадает в этот диапазон.
 * 3. Если completed_at не заполнен, но статус completed —
 *    фоллбэк на updatedAt, т.к. статус мог быть выставлен без
 *    явной записи даты завершения.
 */
const thisWeekCompleted = computed<number>(() => {
  // Начало сегодняшнего дня в миллисекундах
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 7 дней назад (включая сегодня)
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoMs = weekAgo.getTime();

  return mediaStore.userMedia.filter((item: UserMedia) => {
    if (item.status !== "completed") return false;

    // Предпочитаем completed_at как точную дату завершения.
    // Если поле пустое — используем updatedAt как запасной вариант.
    const rawDate = item.completed_at ?? item.updatedAt;
    if (!rawDate) return false;

    const completedMs = new Date(rawDate).getTime();

    // Проверяем что дата валидна (защита от некорректных строк)
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
const scrollPosition = window.scrollY || document.documentElement.scrollTop
function openSearchModal(type: MediaType) {
  selectedMediaType.value = type;
  isSearchModalOpen.value = true;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.top = `-${scrollPosition}px`
}

function closeSearchModal() {
  isSearchModalOpen.value = false;
  document.body.style.overflow = 'auto';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
}

async function handleMediaSelect(
  item: ExternalMovie | ExternalBook | ExternalGame,
  status: MediaStatus,
) {
  if (!authStore.isAuthenticated) {
    showNotification(
      "Войдите в аккаунт, чтобы сохранять медиа в свой список",
      "error",
    );
    return;
  }

  const result = await mediaStore.addMediaFromExternal(
    item,
    selectedMediaType.value,
    status,
  );

  showNotification(
    result.success
      ? result.message || "Медиа успешно добавлено!"
      : result.error || "Ошибка при добавлении медиа",
    result.success ? "success" : "error",
  );
}

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
    result.success ? "success" : "error",
  );
}

async function handleDeleteItem(id: string) {
  const result = await mediaStore.deleteMedia(id);
  showNotification(
    result.success
      ? "Элемент удалён из списка"
      : result.error || "Ошибка при удалении",
    result.success ? "success" : "error",
  );
}

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => (notification.value = null), 3000);
}

function handleUpdateStatus(id: string, status: MediaStatus) {
  handleStatusUpdate(id, status);
}

function handleViewAllInProgress() {}
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">
    <SkeletonLoader v-if="loading" />
    <div v-else class="container-xl px-6 py-8">
      <!-- Уведомление -->
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

      <!-- Шапка -->

      <WelcomeCTA v-if="!authStore.user" />

      <!-- Hero: в процессе -->
      <InProgressHero
        v-if="authStore.isAuthenticated"
        :items="inProgressItems"
        @update-status="handleUpdateStatus"
        @view-all="handleViewAllInProgress"
      />

      <div class="mb-6">
        <h2 class="mb-2">Статистика</h2>
        <p class="text-sm text-(--text-tertiary)">
          Отслеживайте свой прогресс по всем категориям
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        <ActivityCard
          :books-stats="activityStats.booksStats"
          :movies-stats="activityStats.moviesStats"
          :games-stats="activityStats.gamesStats"
          :this-week-completed="activityStats.thisWeekCompleted"
        />

        <MediaTypeCard
          v-if="authStore.user"
          title="Книги"
          :icon="BookOpen"
          :stats="stats.books"
          variant="books"
          @add="() => openSearchModal('book')"
        />
        <MediaTypeCard
          v-if="authStore.user"
          title="Фильмы и Сериалы"
          :icon="Film"
          :stats="stats.movies"
          variant="movies"
          @add="() => openSearchModal('movie')"
        />
        <MediaTypeCard
          v-if="authStore.user"
          title="Игры"
          :icon="Gamepad2"
          :stats="stats.games"
          variant="games"
          @add="() => openSearchModal('game')"
        />
      </div>

      <MediaAccordion
        class="pt-8"
        v-if="authStore.user && mediaStore.userMedia.length > 0"
        :user-media="mediaStore.userMedia"
        @update-status="handleStatusUpdate"
        @delete-item="handleDeleteItem"
      />

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
