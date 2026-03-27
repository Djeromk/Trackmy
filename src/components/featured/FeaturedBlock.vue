<!-- src/components/featured/FeaturedBlock.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { featuredService } from '@/services/featuredService'
import { useMediaStore } from '@/stores/media'
import type { AllFeatured } from '@/types/featured'
import type { FeaturedItem } from '@/types/featured'
import type { MediaStatus } from '@/types'
import { createStatusUpdatePayload } from '@/utils/utils'
import FeaturedSection from './FeaturedSection.vue'

/**
 * FeaturedBlock — блок трёх кураторских секций на главной странице.
 *
 * Отвечает за:
 * - загрузку данных из featuredService (один раз при монтировании)
 * - обработку add/update событий от дочерних FeaturedSection
 * - делегирование mediaStore операций
 *
 * FeaturedSection и FeaturedCard — "тупые" компоненты,
 * вся бизнес-логика сосредоточена здесь.
 */

const mediaStore = useMediaStore()

const featured = ref<AllFeatured>({
  movies: [],
  books: [],
  games: [],
})

/**
 * loading — единый флаг для всех трёх секций.
 * Все три запроса летят параллельно через Promise.all,
 * поэтому один флаг отражает состояние всего блока.
 */
const loading = ref(true)

/**
 * error — текст ошибки загрузки.
 * null когда загрузка успешна или ещё идёт.
 */
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    featured.value = await featuredService.getAllFeatured()
  } catch (e) {
    error.value = 'Не удалось загрузить подборки'
    console.error('[FeaturedBlock] Failed to load featured:', e)
  } finally {
    loading.value = false
  }
})

/**
 * handleAdd — пользователь добавляет featured-элемент в свой список.
 *
 * Конвертируем FeaturedItem в объект совместимый с ExternalMovie/Book/Game
 * чтобы переиспользовать mediaService.createMediaFromExternal.
 * Запись в media_items уже существует (ты создал её вручную),
 * mediaService найдёт её по external_id и пропустит создание —
 * выполнится только INSERT в user_media.
 */
async function handleAdd(item: FeaturedItem, status: MediaStatus) {
  /**
   * Приводим FeaturedItem к минимальному ExternalMovie/Book/Game-интерфейсу.
   *
   * mediaService.prepareMediaData читает поля через duck-typing:
   * - "title" in item → title
   * - "thumbnail" in item → coverUrl
   * - "id" in item → external_id
   *
   * Поэтому передаём объект с нужными полями.
   * isSeries = false — безопасный дефолт; если запись в media_items
   * уже существует, это поле не используется (создание пропускается).
   */
  await mediaStore.addMediaFromExternal(
    {
      id: item.external_id,
      title: item.title,
      thumbnail: item.cover_url ?? '',
      isSeries: false,
      // Остальные поля ExternalMovie требуются типом но не используются
      // в createMediaFromExternal при нахождении существующей записи.
      // Передаём безопасные значения:
      imdbId: '',
      nameRu: item.title,
      nameEn: '',
      nameOriginal: '',
      countries: [],
      genres: [],
      ratingKinopoisk: 0,
      ratingImdb: 0,
      year: 0,
      type: '',
      posterUrl: item.cover_url ?? '',
      posterUrlPreview: item.cover_url ?? '',
    },
    item.type,
    status,
  )
}

/**
 * handleUpdate — пользователь меняет статус уже добавленного элемента.
 *
 * createStatusUpdatePayload из utils вычисляет is_finished и completed_at
 * на основе нового статуса — та же логика что в MoviePage/GamePage.
 */
async function handleUpdate(userMediaId: string, status: MediaStatus) {
  const updates = createStatusUpdatePayload(status)
  await mediaStore.updateMedia(userMediaId, updates)
}
</script>

<template>
  <div class="featured-block">
    <!-- Заголовок блока -->
    <div class="featured-block__header">
      <h2 class="featured-block__title">Популярное</h2>
      <p class="featured-block__subtitle">
        Добавляй в список одним нажатием
      </p>
    </div>

    <!-- Ошибка загрузки -->
    <div v-if="error" class="featured-block__error">
      <p class="text-sm text-(--text-tertiary)">{{ error }}</p>
    </div>

    <!-- Три секции карусели -->
    <div v-else class="featured-block__sections">
      <FeaturedSection
        title="Фильмы и сериалы"
        :items="featured.movies"
        media-type="movie"
        :loading="loading"
        @add="handleAdd"
        @update="handleUpdate"
      />

      <FeaturedSection
        title="Книги"
        :items="featured.books"
        media-type="book"
        :loading="loading"
        @add="handleAdd"
        @update="handleUpdate"
      />

      <FeaturedSection
        title="Игры"
        :items="featured.games"
        media-type="game"
        :loading="loading"
        @add="handleAdd"
        @update="handleUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.featured-block {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Заголовок ───────────────────────────────────────── */
.featured-block__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.featured-block__title {
  /* h2 стили подтянутся из глобального style.css */
  margin: 0;
}

.featured-block__subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
}

/* ── Секции ──────────────────────────────────────────── */
.featured-block__sections {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* ── Ошибка ──────────────────────────────────────────── */
.featured-block__error {
  padding: 1.5rem;
  border-radius: var(--border-radius-md);
  background-color: var(--background-subtle);
  border: 1px solid var(--border-color);
  text-align: center;
}
</style>
