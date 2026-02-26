<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { KinopoiskItemByID, MediaStatus } from "@/types";
import { kinopoiskService } from "@/services/api/kinopoisk";
import { useMediaStore } from "@/stores/media";
import Tag from "@/components/tag/tag.vue";
import MediaStatusDropdown from "@/components/media/MediaStatusDropdown.vue";
import MediaRating from "@/components/media/MediaRating.vue";
import MediaPoster from "@/components/media/MediaPoster.vue";
import MovieRatings from "@/components/media/MovieRatings.vue";
import SeriesProgress from "@/components/series/SeriesProgress.vue";
import { useNotFound } from "@/composables/useNotFound";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Layers,
  Quote,
  Tv,
  Film,
  Loader,
  ExternalLink,
  MessageCircle,
  BadgeCheck,
} from "lucide-vue-next";
import {
  findUserMediaEntry,
  transformKinopoiskToExternalMovie,
  createStatusUpdatePayload,
  getMovieTitle,
  getMovieOriginalTitle,
  formatFilmLength,
} from "@/utils/utils";

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const movieId: string = route.params.id as string;
const movie = ref<KinopoiskItemByID | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
  const { redirectToNotFound } = useNotFound()

const userMediaEntry = computed(() =>
  findUserMediaEntry(mediaStore.userMedia, movieId)
);

const currentStatus = computed(() => userMediaEntry.value?.status ?? null);

const contentTypeLabel = computed(() => {
  if (!movie.value) return "";
  return movie.value.serial ? "Сериал" : "Фильм";
});

const ContentTypeIcon = computed(() => {
  if (!movie.value) return Film;
  return movie.value.type === "TV_SHOW" ? Tv : Film;
});

onMounted(async () => {
  if (!movieId) {
    error.value = "ID фильма не указан";
    loading.value = false;
    return;
  }
  try {
    movie.value =  (await kinopoiskService.searchMovieByID(movieId));
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      redirectToNotFound()
      return
    }
    error.value = 'Не удалось загрузить фильм'
  } finally {
    loading.value = false
  }
});

async function handleAddMovie(status: MediaStatus) {
  if (!movie.value) return;
  const mediaItem = transformKinopoiskToExternalMovie(movie.value);
  await mediaStore.addMediaFromExternal(mediaItem, "movie", status);
}

async function handleUpdateStatus(status: MediaStatus) {
  if (!userMediaEntry.value || status === currentStatus.value) return;
  const updates = createStatusUpdatePayload(status);
  await mediaStore.updateMedia(userMediaEntry.value.id, updates);
}
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">
    <div class="border-b border-(--border-color) bg-(--background-card)">
      <div class="max-w-5xl mx-auto px-6 py-4">
        <button
          @click="router.back()"
          class="btn-ghost flex items-center gap-2 text-(--text-tertiary) hover:text-(--text-primary)"
        >
          <ArrowLeft :size="18" />
          <span class="text-sm font-medium">Назад</span>
        </button>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-6 py-10">
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <Loader :size="40" class="text-(--primary-500) animate-spin" />
        <p class="text-sm text-(--text-tertiary)">Загрузка информации...</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-16 h-16 rounded-full bg-(--gray-100) flex items-center justify-center">
          <Film :size="28" class="text-(--gray-400)" />
        </div>
        <p class="text-base font-medium text-(--text-primary)">{{ error }}</p>
        <button @click="router.back()" class="btn-secondary">
          Вернуться назад
        </button>
      </div>
      <div v-else-if="movie" class="flex flex-col lg:flex-row gap-10">

        <div class="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          <div class="relative group">
            <div class="rounded-2xl overflow-hidden shadow-(--shadow-lg) ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-[1.02]">
              <MediaPoster
                :src="movie.posterUrl"
                :alt="getMovieTitle(movie)"
                fallback-icon="film"
              />
            </div>
            <div
              class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
              :class="movie.serial ? 'bg-(--primary-600)' : 'bg-(--gray-700)'"
            >
              <component :is="ContentTypeIcon" :size="12" />
              {{ contentTypeLabel }}
            </div>
          </div>

          <!--
            Дропдаун выбора статуса (вынесен в отдельный компонент).
            Передаём: текущую запись пользователя, статус, тип медиа.
            Слушаем: add (новая запись), update (обновление существующей).
          -->
          <MediaStatusDropdown
            :user-media-entry="userMediaEntry"
            :current-status="currentStatus"
            media-type="movie"
            @add="handleAddMovie"
            @update="handleUpdateStatus"
          />

          <!-- Звёздный рейтинг — только если фильм добавлен в список -->
          <MediaRating
            v-if="userMediaEntry"
            :user-media-entry="userMediaEntry"
          />

          <!-- Мета-карточка: тип, год, длительность, возраст -->
          <div class="card-padded space-y-3">
            <div class="flex items-center gap-3">
              <component :is="ContentTypeIcon" :size="15" class="text-(--primary-500) shrink-0" />
              <div>
                <p class="text-xs text-(--text-tertiary)">Тип</p>
                <p class="text-sm text-(--text-secondary) font-medium">{{ contentTypeLabel }}</p>
              </div>
            </div>
            <div v-if="movie.year" class="flex items-center gap-3">
              <Calendar :size="15" class="text-(--primary-500) shrink-0" />
              <div>
                <p class="text-xs text-(--text-tertiary)">Год</p>
                <p class="text-sm text-(--text-secondary) font-medium">{{ movie.year }}</p>
              </div>
            </div>
            <div v-if="movie.filmLength" class="flex items-center gap-3">
              <Clock :size="15" class="text-(--primary-500) shrink-0" />
              <div>
                <p class="text-xs text-(--text-tertiary)">Длительность</p>
                <p class="text-sm text-(--text-secondary) font-medium">{{ formatFilmLength(movie.filmLength) }}</p>
              </div>
            </div>
            <div v-if="movie.ratingAgeLimits" class="flex items-center gap-3">
              <BadgeCheck :size="15" class="text-(--primary-500) shrink-0" />
              <div>
                <p class="text-xs text-(--text-tertiary)">Возраст</p>
                <p class="text-sm text-(--text-secondary) font-medium">{{ movie.ratingAgeLimits }}</p>
              </div>
            </div>
            <div v-if="movie.countries?.length" class="flex items-start gap-3">
              <Globe :size="15" class="text-(--primary-500) shrink-0 mt-0.5" />
              <div>
                <p class="text-xs text-(--text-tertiary) mb-1">Страны</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="c in movie.countries"
                    :key="c.country"
                    class="text-xs text-(--text-secondary)"
                  >{{ c.country }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ссылка на Кинопоиск -->
          <a
            v-if="movie.webUrl"
            :href="movie.webUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-(--border-color) text-sm text-(--text-tertiary) hover:text-(--primary-600) hover:border-(--primary-300) hover:bg-(--primary-50) transition-all duration-200"
          >
            <ExternalLink :size="15" />
            <span>Открыть на Кинопоиске</span>
          </a>
        </div>

        <!-- ═══════════════════════════════════
             ПРАВАЯ КОЛОНКА: детали фильма
             ═══════════════════════════════════ -->
        <div class="flex-1 min-w-0 flex flex-col gap-6">

          <!-- Заголовок: название и оригинальное название -->
          <div>
            <h1 class="mb-2 leading-tight">
              {{ getMovieTitle(movie) }}
            </h1>
            <p
              v-if="getMovieOriginalTitle(movie)"
              class="text-base text-(--text-tertiary)"
            >
              {{ getMovieOriginalTitle(movie) }}
            </p>
          </div>

          <!-- Слоган фильма — цитата в блоке с иконкой -->
          <div
            v-if="movie.slogan"
            class="flex items-start gap-3 px-4 py-3 rounded-xl bg-(--gray-50) border-l-4 border-(--primary-300)"
          >
            <Quote :size="18" class="text-(--primary-400) shrink-0 mt-0.5" />
            <span class="text-sm text-(--text-secondary) italic">{{ movie.slogan }}</span>
          </div>

          <!--
            Рейтинги Кинопоиска и IMDB.
            Вынесены в отдельный компонент MovieRatings.
          -->
          <MovieRatings
            :rating-kinopoisk="movie.ratingKinopoisk"
            :rating-kinopoisk-vote-count="movie.ratingKinopoiskVoteCount"
            :rating-imdb="movie.ratingImdb"
            :rating-imdb-vote-count="movie.ratingImdbVoteCount"
          />

          <!-- Жанры фильма в виде тегов -->
          <div v-if="movie.genres?.length">
            <div class="flex items-center gap-2 mb-3">
              <Layers :size="16" class="text-(--primary-500)" />
              <p class="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">
                Жанры
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="g in movie.genres"
                :key="g.genre"
                :label="g.genre"
              />
            </div>
          </div>

          <!-- Описание фильма -->
          <div v-if="movie.description" class="card-padded">
            <h2 class="text-base font-semibold text-(--text-primary) mb-4">
              Описание
            </h2>
            <p
              class="text-sm text-(--text-secondary) leading-relaxed whitespace-pre-line"
              v-html="movie.description"
            />
          </div>

          <!-- Краткое описание (shortDescription) -->
          <div
            v-if="movie.shortDescription && movie.shortDescription !== movie.description"
            class="p-4 rounded-xl bg-(--primary-50) border border-(--primary-100)"
          >
            <p class="text-sm text-(--primary-700) leading-relaxed italic">
              {{ movie.shortDescription }}
            </p>
          </div>

          <!-- Дополнительные статы: отзывы, аннотация -->
          <div
            v-if="movie.reviewsCount || movie.editorAnnotation"
            class="card-padded space-y-4"
          >
            <h2 class="text-base font-semibold text-(--text-primary)">
              Дополнительно
            </h2>

            <div
              v-if="movie.reviewsCount"
              class="flex items-center gap-2 text-sm text-(--text-secondary)"
            >
              <MessageCircle :size="16" class="text-(--primary-500) shrink-0" />
              <span>{{ movie.reviewsCount }} отзывов</span>
            </div>

            <p
              v-if="movie.editorAnnotation"
              class="text-sm text-(--text-tertiary) leading-relaxed italic"
            >
              {{ movie.editorAnnotation }}
            </p>
          </div>

          <!--
            Блок отслеживания прогресса сериала.
            Показывается только если:
            - это сериал (movie.serial === true)
            - пользователь добавил его в свой список
          -->
          <SeriesProgress
            v-if="movie.serial && userMediaEntry"
            :movie-id="movieId"
            :user-media-entry="userMediaEntry"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Плавное появление страницы */
.flex-1 > * {
  animation: fadeInUp 0.3s ease-out both;
}

.flex-1 > *:nth-child(2) { animation-delay: 40ms; }
.flex-1 > *:nth-child(3) { animation-delay: 80ms; }
.flex-1 > *:nth-child(4) { animation-delay: 120ms; }
.flex-1 > *:nth-child(5) { animation-delay: 160ms; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Стили для HTML-разметки из Кинопоиска в описании */
:deep(br) {
  display: block;
  margin-bottom: 0.4em;
  content: "";
}
</style>
