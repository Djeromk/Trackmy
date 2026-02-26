<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { GameById, MediaStatus } from "@/types";
import { gamesService } from "@/services/api/games";
import { useMediaStore } from "@/stores/media";
import MediaStatusDropdown from "@/components/media/MediaStatusDropdown.vue";
import MediaRating from "@/components/media/MediaRating.vue";
import MediaPoster from "@/components/media/MediaPoster.vue";
import { useNotFound } from "@/composables/useNotFound";
import {
  ArrowLeft,
  Calendar,
  Loader,
  ExternalLink,
  Trophy,
  Tag,
  Users,
  Gamepad2,
  Shield,
  Star
} from "lucide-vue-next";
import {
  findUserMediaEntry,
  transformGameToExternalGame,
  createStatusUpdatePayload,
} from "@/utils/utils";

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const gameId: string = route.params.id as string;
const game = ref<GameById | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
  const { redirectToNotFound } = useNotFound()

const userMediaEntry = computed(() =>
  findUserMediaEntry(mediaStore.userMedia, gameId)
);

const currentStatus = computed(() => userMediaEntry.value?.status ?? null);

/**
 * Вычисляем цвет Metacritic на основе оценки
 */
const metacriticColor = computed(() => {
  if (!game.value?.metacritic) return 'var(--gray-400)';
  const score = game.value.metacritic;

  if (score >= 75) return '#66cc33'; // Зеленый - отлично
  if (score >= 50) return '#ffcc33'; // Желтый - средне
  return '#ff6666'; // Красный - плохо
});

/**
 * Форматируем дату релиза
 */
const formattedReleaseDate = computed(() => {
  if (!game.value?.released) return null;

  try {
    const date = new Date(game.value.released);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return game.value.released;
  }
});

/**
 * Получаем список платформ
 */
const platforms = computed(() => {
  if (!game.value?.platforms) return [];
  return game.value.platforms.map(p => p.platform.name);
});

/**
 * Получаем список тегов (ограничено 10)
 */
const tags = computed(() => {
  if (!game.value?.tags) return [];
  return game.value.tags.slice(0, 10);
});

/**
 * Получаем список разработчиков
 */
const developers = computed(() => {
  if (!game.value?.developers) return [];
  return game.value.developers;
});

onMounted(async () => {
  if (!gameId) {
    error.value = "ID игры не указан";
    loading.value = false;
    return;
  }
  try {
    game.value = await gamesService.getGameDetails(gameId);
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      redirectToNotFound()
      return
    }
    error.value = "Не удалось загрузить игру";
  } finally {
    loading.value = false;
  }
});

async function handleAddGame(status: MediaStatus) {
  if (!game.value) return;
  const mediaItem = transformGameToExternalGame(game.value);
  await mediaStore.addMediaFromExternal(mediaItem, "game", status);
}

async function handleUpdateStatus(status: MediaStatus) {
  if (!userMediaEntry.value || status === currentStatus.value) return;
  const updates = createStatusUpdatePayload(status);
  await mediaStore.updateMedia(userMediaEntry.value.id, updates);
}
</script>

<template>
  <div class="min-h-screen bg-(--background-body) p-6">
    <div class="max-w-6xl mx-auto">

      <!-- Кнопка назад -->
      <button
        @click="router.back()"
        class="btn-ghost flex items-center gap-2 mb-8"
      >
        <ArrowLeft :size="20" />
        <span>Назад</span>
      </button>

      <!-- Загрузка -->
      <div v-if="loading" class="flex justify-center py-24">
        <Loader :size="48" class="text-(--primary-500) animate-spin" />
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="text-center py-24">
        <p class="text-(--error-500) text-lg">{{ error }}</p>
        <button
          @click="router.back()"
          class="btn-primary mt-4"
        >
          Вернуться назад
        </button>
      </div>

      <!-- Контент игры -->
      <div v-else-if="game" class="flex flex-col lg:flex-row gap-8">

        <!-- Левая колонка: Постер и действия -->
        <div class="w-full lg:w-80 shrink-0 flex flex-col gap-6">

          <!-- Постер -->
          <MediaPoster
            :src="game.background_image"
            :alt="game.name"
            fallback-icon="gamepad"
          />

          <!-- Dropdown выбора статуса -->
          <MediaStatusDropdown
            :user-media-entry="userMediaEntry"
            :current-status="currentStatus"
            media-type="game"
            @add="handleAddGame"
            @update="handleUpdateStatus"
          />

          <!-- Рейтинг пользователя -->
          <MediaRating
            v-if="userMediaEntry"
            :user-media-entry="userMediaEntry"
          />

          <!-- Metacritic Score -->
          <div
            v-if="game.metacritic"
            class="card-padded"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Trophy :size="18" class="text-(--primary-600)" />
                <span class="text-sm font-semibold text-(--text-primary)">
                  Metacritic
                </span>
              </div>
              <a
                v-if="game.metacritic_url"
                :href="game.metacritic_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-(--primary-600) hover:underline"
              >
                Подробнее
              </a>
            </div>

            <!-- Большой счет -->
            <div
              class="w-16 h-16 mx-auto rounded-lg flex items-center justify-center"
              :style="{
                backgroundColor: `${metacriticColor}33`,
                borderLeft: `4px solid ${metacriticColor}`
              }"
            >
              <span
                class="text-2xl font-bold"
                :style="{ color: metacriticColor }"
              >
                {{ game.metacritic }}
              </span>
            </div>
          </div>

          <!-- ESRB Rating -->
          <div
            v-if="game.esrb_rating"
            class="card-padded"
          >
            <div class="flex items-center gap-2 mb-2">
              <Shield :size="18" class="text-(--primary-600)" />
              <span class="text-sm font-semibold text-(--text-primary)">
                Возрастной рейтинг
              </span>
            </div>
            <div class="px-3 py-2 rounded-lg bg-(--gray-100) text-center">
              <span class="text-base font-semibold text-(--text-primary)">
                {{ game.esrb_rating.name }}
              </span>
            </div>
          </div>

          <!-- Общий рейтинг -->
          <div
            v-if="game.rating"
            class="card-padded"
          >
            <div class="flex items-center gap-2 mb-3">
              <Star :size="18" class="text-(--primary-600)" />
              <span class="text-sm font-semibold text-(--text-primary)">
                Рейтинг игроков
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold text-(--text-primary)">
                {{ game.rating.toFixed(1) }}
              </span>
              <span class="text-sm text-(--text-tertiary)">
                / {{ game.rating_top }}
              </span>
            </div>
            <p class="text-xs text-(--text-tertiary) mt-1">
              {{ game.ratings_count?.toLocaleString('ru-RU') }} оценок
            </p>
          </div>
        </div>

        <!-- Правая колонка: Информация -->
        <div class="flex-1 flex flex-col gap-6">

          <!-- Заголовок -->
          <div>
            <h1 class="mb-2">{{ game.name }}</h1>
            <p
              v-if="game.name_original && game.name_original !== game.name"
              class="text-lg text-(--text-tertiary)"
            >
              {{ game.name_original }}
            </p>
          </div>

          <!-- Мета информация -->
          <div class="flex flex-wrap gap-4">

            <!-- Дата релиза -->
            <div
              v-if="formattedReleaseDate"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-(--background-subtle)"
            >
              <Calendar :size="16" class="text-(--primary-600)" />
              <span class="text-sm text-(--text-secondary)">
                {{ formattedReleaseDate }}
              </span>
            </div>

            <!-- Жанры (если есть в API) -->
            <div
              v-if="game.genres && game.genres.length > 0"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-(--background-subtle)"
            >
              <Gamepad2 :size="16" class="text-(--primary-600)" />
              <span class="text-sm text-(--text-secondary)">
                {{ game.genres.map(g => g.name).join(', ') }}
              </span>
            </div>
          </div>

          <!-- Платформы -->
          <div v-if="platforms.length > 0" class="card-padded">
            <h3 class="text-lg font-semibold text-(--text-primary) mb-3">
              Платформы
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="platform in platforms"
                :key="platform"
                class="px-3 py-1.5 rounded-lg bg-(--primary-50) text-sm text-(--primary-700) border border-(--primary-200)"
              >
                {{ platform }}
              </span>
            </div>
          </div>

          <!-- Описание -->
          <div v-if="game.description" class="card-padded">
            <h3 class="text-lg font-semibold text-(--text-primary) mb-3">
              Описание
            </h3>
            <div
              class="text-base text-(--text-secondary) leading-relaxed prose prose-sm max-w-none"
              v-html="game.description"
            />
          </div>

          <!-- Разработчики -->
          <div v-if="developers.length > 0" class="card-padded">
            <div class="flex items-center gap-2 mb-4">
              <Users :size="20" class="text-(--primary-600)" />
              <h3 class="text-lg font-semibold text-(--text-primary)">
                Разработчики
              </h3>
            </div>
            <div class="space-y-3">
              <div
                v-for="dev in developers"
                :key="dev.id"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-(--background-hover) transition-colors"
              >
                <div
                  v-if="dev.image_background"
                  class="w-12 h-12 rounded-lg overflow-hidden bg-(--gray-100) shrink-0"
                >
                  <img
                    :src="dev.image_background"
                    :alt="dev.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  v-else
                  class="w-12 h-12 rounded-lg bg-(--gray-100) flex items-center justify-center shrink-0"
                >
                  <Users :size="20" class="text-(--gray-400)" />
                </div>
                <div class="flex-1">
                  <p class="text-base font-medium text-(--text-primary)">
                    {{ dev.name }}
                  </p>
                  <p class="text-xs text-(--text-tertiary)">
                    {{ dev.games_count }} игр
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Теги -->
          <div v-if="tags.length > 0" class="card-padded">
            <div class="flex items-center gap-2 mb-4">
              <Tag :size="20" class="text-(--primary-600)" />
              <h3 class="text-lg font-semibold text-(--text-primary)">
                Теги
              </h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in tags"
                :key="tag.id"
                class="px-3 py-1.5 rounded-full bg-(--gray-100) text-sm text-(--text-secondary) hover:bg-(--gray-200) transition-colors cursor-default"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Дополнительные ссылки -->
          <div v-if="game.website || game.reddit_url" class="card-padded">
            <h3 class="text-lg font-semibold text-(--text-primary) mb-3">
              Ссылки
            </h3>
            <div class="flex flex-col gap-3">
              <a
                v-if="game.website"
                :href="game.website"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-(--primary-600) hover:text-(--primary-700) transition-colors"
              >
                <ExternalLink :size="18" />
                <span class="text-sm">Официальный сайт</span>
              </a>
              <a
                v-if="game.reddit_url"
                :href="game.reddit_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-(--primary-600) hover:text-(--primary-700) transition-colors"
              >
                <ExternalLink :size="18" />
                <span class="text-sm">Reddit</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/**
 * Стили для HTML контента описания
 */
.prose :deep(p) {
  margin-bottom: 1em;
}

.prose :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.prose :deep(a) {
  color: var(--primary-600);
  text-decoration: underline;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.prose :deep(li) {
  margin-bottom: 0.5em;
}
</style>
