<!-- src/components/series/SeriesProgress.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { kinopoiskService } from '@/services/api/kinopoisk';
import { useMediaStore } from '@/stores/media';
import type {
  KinopoiskTVSeason,
  UserMedia,
} from '@/types';
import type { WatchedEpisodesMap } from '@/types';
import {
  calculateSeriesProgress,
  markEpisodeWatched,
  markEpisodeUnwatched,
  markSeasonWatched,
  markSeasonUnwatched,
  isEpisodeWatched,
  isSeasonWatched
} from '@/utils/seriesProgress';
import { Check, ChevronDown, Play, Loader } from 'lucide-vue-next';

interface Props {
  movieId: string;
  userMediaEntry: UserMedia;
}

const props = defineProps<Props>();
const mediaStore = useMediaStore();

const seasons = ref<KinopoiskTVSeason[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const expandedSeasons = ref<Set<number>>(new Set());

// Локальное состояние watched_episodes для быстрого UI обновления
// Инициализируем из userMediaEntry или пустым объектом
const watchedEpisodes = ref<WatchedEpisodesMap>(
  (props.userMediaEntry.watched_episodes as WatchedEpisodesMap) || {}
);
console.log('props.userMediaEntry SeriesProgress', props.userMediaEntry )

// Вычисляем прогресс на основе сезонов и просмотренных серий
const progress = computed(() =>
calculateSeriesProgress(seasons.value, watchedEpisodes.value)
);
console.log('progress:', progress.value)

/**
 * Загружает информацию о сезонах из API
 * Вызывается при монтировании компонента и при повторной попытке
 */
async function loadSeasons() {
  loading.value = true;
  error.value = null;

  try {
    seasons.value = await kinopoiskService.getTVSeasons(props.movieId);
    if (props.userMediaEntry.status === 'completed' && seasons.value.length > 0) {
      // Считаем текущий прогресс
      const currentProgress = calculateSeriesProgress(seasons.value, watchedEpisodes.value);

      // Проверяем нужна ли инициализация
      const isEmpty = Object.keys(watchedEpisodes.value).length === 0;
      const isIncomplete = currentProgress.completionPercentage < 100;

      if (isEmpty || isIncomplete) {
        console.log('[SeriesProgress] Автоинициализация: сериал завершён, помечаем все серии как просмотренные');

        // Создаём новый объект watched_episodes со всеми сезонами
        const fullWatchedEpisodes: WatchedEpisodesMap = {};

        // Для каждого сезона добавляем все номера серий
        seasons.value.forEach(season => {
          const episodeNumbers = season.episodes.map(ep => ep.episodeNumber);
          fullWatchedEpisodes[season.number.toString()] = episodeNumbers;
        });

        // Обновляем локальное состояние
        watchedEpisodes.value = fullWatchedEpisodes;

        // Синхронизируем с БД
        // Не ждём завершения - пользователь сразу видит обновлённый UI
        syncProgress();
      }
    }
  } catch (e) {
    error.value = 'Не удалось загрузить информацию о сезонах';
    console.error('Error loading TV seasons:', e);
  } finally {
    loading.value = false;
  }
}

// Загружаем сезоны при монтировании компонента
onMounted(loadSeasons);

/**
 * Переключает раскрытие/сворачивание списка серий сезона
 */
function toggleSeasonExpand(seasonNumber: number) {
  if (expandedSeasons.value.has(seasonNumber)) {
    expandedSeasons.value.delete(seasonNumber);
  } else {
    expandedSeasons.value.add(seasonNumber);
  }
}

/**
 * Переключает статус "просмотрено" для отдельной серии
 * Использует оптимистичное обновление UI
 */
async function toggleEpisode(seasonNumber: number, episodeNumber: number) {
  const isWatched = isEpisodeWatched(watchedEpisodes.value, seasonNumber, episodeNumber);

  // Оптимистичное обновление UI (сразу показываем изменение)
  if (isWatched) {
    watchedEpisodes.value = markEpisodeUnwatched(
      watchedEpisodes.value,
      seasonNumber,
      episodeNumber
    );
  } else {
    watchedEpisodes.value = markEpisodeWatched(
      watchedEpisodes.value,
      seasonNumber,
      episodeNumber
    );
  }

  // Синхронизируем с БД
  await syncProgress();
}

/**
 * Переключает статус "просмотрено" для всего сезона
 */
async function toggleSeasonWatched(seasonNumber: number) {
  const season = seasons.value.find(s => s.number === seasonNumber);
  if (!season) return;

  const isWatched = isSeasonWatched(watchedEpisodes.value, season);

  // Оптимистичное обновление UI
  if (isWatched) {
    watchedEpisodes.value = markSeasonUnwatched(watchedEpisodes.value, seasonNumber);
  } else {
    watchedEpisodes.value = markSeasonWatched(watchedEpisodes.value, season);
  }

  // Синхронизируем с БД
  await syncProgress();
}

/**
 * Синхронизирует прогресс с базой данных
 * Автоматически вычисляет current_season и current_episode
 */
async function syncProgress() {
  const current = progress.value;
  const watched_episodes = watchedEpisodes.value;
  console.log('syncProgress watchedEpisodes', watched_episodes);
  await mediaStore.updateMedia(props.userMediaEntry.id, {
    watched_episodes: watched_episodes,
    current_season: current.current_season,
    current_episode: current.current_episode
  });
}
</script>

<template>
  <div class="card-neo p-6">
    <h3 class="text-xl font-semibold mb-4">Прогресс просмотра</h3>

    <!-- Общий прогресс -->
    <div v-if="!loading && !error" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-base text-gray-600">
          {{ progress.watchedEpisodes }} / {{ progress.totalEpisodes }} серий
        </span>
        <span class="text-base font-medium">{{ progress.completionPercentage }}%</span>
      </div>
      <div class="progress-neo">
        <div
          class="progress-fill transition-all duration-500"
          :style="{ width: `${progress.completionPercentage}%` }"
        />
      </div>

      <!-- Текущая серия -->
      <div v-if="progress.current_season && progress.current_episode" class="mt-4 flex items-center gap-2 text-primary-600">
        <Play :size="18" />
        <span class="text-base font-medium">
          Текущая серия: S{{ progress.current_season }}E{{ progress.current_episode }}
        </span>
      </div>
      <div v-else-if="progress.completionPercentage === 100" class="mt-4 flex items-center gap-2 text-green-600">
        <Check :size="18"  />
        <span class="text-base font-medium">
          Сериал полностью просмотрен!
        </span>
      </div>
    </div>

    <!-- Список сезонов -->
    <div v-if="!loading && !error" class="space-y-3">
      <div
        v-for="season in seasons"
        :key="season.number"
        class="border border-gray-200 rounded-xl overflow-hidden"
      >
        <!-- Заголовок сезона -->
        <button
          @click="toggleSeasonExpand(season.number)"
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <!-- Чекбокс сезона -->
            <button
              @click.stop="toggleSeasonWatched(season.number)"
              class="w-6 h-6 cursor-pointer rounded border-2 border-gray-300 flex items-center justify-center hover:border-primary-600 transition-colors"
              :class="{ 'bg-primary-600 border-primary-600': isSeasonWatched(watchedEpisodes, season) }"
            >
              <Check
                v-if="isSeasonWatched(watchedEpisodes, season)"
                :size="17"
                class="text-green-600"
              />
            </button>

            <span class="font-medium">Сезон {{ season.number }}</span>
            <span class="text-base text-gray-500">
              {{ progress.seasons[season.number - 1]?.watchedCount || 0 }} / {{ season.episodes.length }}
            </span>
          </div>

          <ChevronDown
            :size="18"
            :class="[
              'transition-transform',
              expandedSeasons.has(season.number) ? 'rotate-180' : ''
            ]"
          />
        </button>

        <!-- Список серий (раскрывается при клике) -->
        <Transition name="expand">
          <div v-if="expandedSeasons.has(season.number)" class="border-t border-gray-200">
            <div
              v-for="episode in season.episodes"
              :key="episode.episodeNumber"
              class="px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors"
            >
              <!-- Чекбокс серии -->
              <button
                @click="toggleEpisode(season.number, episode.episodeNumber)"
                class="cursor-pointer mt-0.5 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-primary-600 transition-colors shrink-0"
                :class="{ 'bg-primary-600 border-primary-600': isEpisodeWatched(watchedEpisodes, season.number, episode.episodeNumber) }"
              >
                <Check
                  v-if="isEpisodeWatched(watchedEpisodes, season.number, episode.episodeNumber)"
                  :size="14"
                  class="text-white"
                />
              </button>

              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2">
                  <span class="text-base font-medium">
                    Серия {{ episode.episodeNumber }}
                  </span>
                  <span class="text-base text-gray-600 truncate">
                    {{ episode.nameRu || episode.nameEn }}
                  </span>
                </div>
                <p v-if="episode.synopsis" class="text-sm text-gray-500 mt-1 line-clamp-2">
                  {{ episode.synopsis }}
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Loading состояние -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-gray-500">
      <Loader :size="32" class="animate-spin mb-3" />
      <span class="text-sm">Загрузка информации о сезонах...</span>
    </div>

    <!-- Ошибка загрузки -->
    <div v-if="error" class="text-center py-12">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <button
        @click="loadSeasons"
        class="text-sm text-primary-600 hover:underline"
      >
        Попробовать снова
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Анимация раскрытия списка серий */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Обрезка текста до 2 строк */
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
