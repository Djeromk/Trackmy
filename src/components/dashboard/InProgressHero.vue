<script setup lang="ts">
import { computed } from "vue";
import type { UserMedia, MediaStatus } from "@/types";
import { BookOpen, Film, Gamepad2, ChevronRight, Clock, Star } from "lucide-vue-next";
import { getOptimizedImage } from "@/utils/utils";

interface Props {
  items: UserMedia[]; // Список медиа в процессе
}

interface Emits {
  (e: "updateStatus", id: string, status: MediaStatus): void;
  (e: "viewAll"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function getMediaIcon(type: string) {
  switch (type) {
    case "book":
      return BookOpen;
    case "movie":
      return Film;
    case "game":
      return Gamepad2;
    default:
      return BookOpen;
  }
}

function getEpisodes(item: UserMedia) {
  const currentSeason = item.current_season;
  const currentEpisode = item.current_episode;
  return `${currentSeason} сезон, ${currentEpisode} серия`;
}

function getMediaAction(type: string): string {
  switch (type) {
    case "book":
      return "Читаю";
    case "movie":
      return "Смотрю";
    case "game":
      return "Играю";
    default:
      return "В процессе";
  }
}

function getMediaTitle(item: UserMedia): string {
  return item.media?.title || "Без названия";
}

function getCoverUrl(item: UserMedia): string | null {
  return item.media?.coverUrl || item.media?.cover_url || null;
}

const visibleItems = computed(() => props.items.slice(0, 5).reverse());

const hasMore = computed(() => props.items.length > 4);

const remainingCount = computed(() => Math.max(0, props.items.length - 3));

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
</script>

<template>
  <div v-if="items.length > 0" class="mb-8 animate-slide-in">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-2xl font-bold text-(--text-primary) mb-1">
          Сейчас в процессе
        </h3>
        <p class="text-sm text-(--text-tertiary)">
          {{ items.length }} {{ items.length === 1 ? "элемент" : "элемента" }}
        </p>
      </div>

      <!-- Кнопка "Смотреть все" если элементов больше 3 -->
      <button
        v-if="hasMore"
        @click="emit('viewAll')"
        class="btn-ghost flex items-center gap-1"
      >
        <span>Все {{ items.length }}</span>
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Сетка медиа (максимум 3 элемента) -->
    <div class="scrollbar-hide-true w-full overflow-x-auto">
      <div class="flex flex-nowrap gap-4 w-fit">
        <!-- Карточка каждого медиа -->

        <div
          v-for="(item, index) in visibleItems"
          :key="item.id"
          :title="getMediaTitle(item)"
          class="card-padded  w-72 sm:w-80 lg:w-95 flex items-center gap-4 hover:shadow-(--shadow-md) transition-all duration-(--transition-base)"
          :class="`hero-${item.media?.type}-card`"
          :style="{
            animationDelay: `${index * 50}ms`,

          }"
        >
          <router-link
            :to="`/${item.media?.type}s/${item.media?.external_id}`"
            class="flex items-center gap-4 cursor-pointer"
          >
            <!-- Обложка -->
            <div
              class="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-(--gray-100) shadow-(--shadow-xs)"
            >
              <img
                v-if="getCoverUrl(item)"
                :src="getOptimizedImage(getCoverUrl(item)!)!"
                :alt="getMediaTitle(item)"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-(--text-tertiary) text-2xl"
              >
                📄
              </div>
            </div>

            <!-- Информация -->
            <div class="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <!-- Тип медиа и действие -->
                <div class="flex items-center gap-2 mb-1">
                  <component
                    :is="getMediaIcon(item.media?.type || '')"
                    :size="14"
                    class="text-(--primary-600) shrink-0"
                  />
                  <span
                    class="text-xs text-(--primary-700) font-medium uppercase tracking-wide"
                  >
                    {{ getMediaAction(item.media?.type || "") }}
                  </span>
                </div>

                <!-- Название -->
                <h4
                  class="text-base whitespace-normal font-semibold text-(--text-primary) mb-1 text-ellipsis-2"
                >
                  {{ getMediaTitle(item) }}
                </h4>

                <span
                  v-if="item.current_episode !== null"
                  class="badge-in-progress inline-flex"
                >
                  {{ getEpisodes(item) }}
                </span>
              </div>

              <!-- Дата обновления и рейтинг -->
              <div class="flex items-center gap-3 mt-2 text-xs text-(--text-tertiary)">
                <div v-if="item.updatedAt" class="flex items-center gap-1">
                  <Clock :size="12" />
                  <span>{{ formatDate(item.updatedAt) }}</span>
                </div>
                <div v-if="item.rating" class="flex items-center gap-1">
                  <Star :size="12" class="fill-yellow-400 text-yellow-400" />
                  <span class="font-medium">{{ item.rating }}/10</span>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    <!-- Индикатор скрытых элементов -->
    <div
      v-if="hasMore"
      class="mt-4 pt-4 border-t border-(--primary-200) flex items-center justify-center"
    >
      <button
        @click="emit('viewAll')"
        class="text-sm text-(--primary-700) font-medium hover:text-(--primary-800) transition-colors"
      >
        + еще {{ remainingCount }}
        {{ remainingCount === 1 ? "элемент" : "элемента" }}
      </button>
    </div>
  </div>

  <!-- Пустое состояние - если нет элементов в процессе -->
  <div v-else class="card-padded mb-8 text-center py-12">
    <div
      class="w-16 h-16 mx-auto mb-4 rounded-full bg-(--background-subtle) flex items-center justify-center"
    >
      <BookOpen :size="24" class="text-(--gray-400)" />
    </div>
    <h4 class="text-lg font-semibold text-(--text-primary) mb-2">
      Нет активных элементов
    </h4>
    <p class="text-sm text-(--text-tertiary)">
      Добавьте медиа в статус "В процессе", чтобы увидеть их здесь
    </p>
  </div>
</template>

<style scoped>
/**
 * Каждая карточка появляется с задержкой для плавного эффекта
 */
.card-padded {
  animation: slideIn var(--transition-slower) ease-out;
}
@media (max-width: 640px) {
  /* Уменьшить размер обложки */
  .w-16.h-20 {
    width: 3rem;   /* было 4rem */
    height: 4.5rem; /* было 5rem */
  }

  /* Заголовок в карточке */
  h4.text-base {
    font-size: 0.875rem;
  }

  /* Уменьшить padding карточки */
  .card-padded {
    padding: 0.75rem;
  }
}
</style>
