<!-- src/components/featured/FeaturedSection.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import type { FeaturedItem, FeaturedItemEnriched } from '@/types/featured'
import type { MediaStatus, MediaType } from '@/types'
import { createStatusUpdatePayload } from '@/utils/utils'
import FeaturedCard from './FeaturedCard.vue'

interface Props {
  title: string
  items: FeaturedItem[]
  mediaType: MediaType
  loading: boolean
}

interface Emits {
  /**
   * Пользователь хочет добавить элемент с выбранным статусом.
   * Dashboard обработает вызов mediaStore.addMediaFromExternal.
   */
  (e: 'add', item: FeaturedItem, status: MediaStatus): void
  /**
   * Пользователь хочет изменить статус уже добавленного элемента.
   * Dashboard обработает вызов mediaStore.updateMedia.
   */
  (e: 'update', userMediaId: string, status: MediaStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const mediaStore = useMediaStore()
const authStore = useAuthStore()

/**
 * canAdd — показывать ли кнопку "+" на карточках.
 *
 * Скрываем для:
 * - неавторизованных пользователей (нет аккаунта)
 * - анонимных/демо пользователей (isDemoUser)
 *
 * Анонимный пользователь технически "авторизован" в Supabase,
 * но мы не хотим давать ему возможность добавлять в список —
 * данные не сохранятся после закрытия сессии.
 */
const canAdd = computed(
  () => authStore.isAuthenticated && !authStore.isDemoUser,
)

/**
 * enrichedItems — обогащаем каждый FeaturedItem данными из userMedia.
 *
 * Делаем это на фронте а не в запросе к БД — userMedia уже загружен
 * в store, дополнительных запросов не нужно.
 * Пересчитывается реактивно при изменении userMedia (после добавления/удаления).
 */
const enrichedItems = computed<FeaturedItemEnriched[]>(() =>
  props.items.map((item) => {
    const userMediaEntry = mediaStore.userMedia.find(
      (um) => um.media?.external_id === item.external_id,
    )

    return {
      ...item,
      isAdded: !!userMediaEntry,
      currentStatus: userMediaEntry?.status ?? null,
      userMediaId: userMediaEntry?.id ?? null,
    }
  }),
)

function handleAdd(item: FeaturedItemEnriched, status: MediaStatus) {
  emit('add', item, status)
}

function handleUpdate(item: FeaturedItemEnriched, status: MediaStatus) {
  // Защита: update возможен только если элемент уже добавлен
  if (!item.userMediaId) return
  // Нет смысла обновлять на тот же статус — пропускаем
  if (item.currentStatus === status) return

  emit('update', item.userMediaId, status)
}
</script>

<template>
  <section class="featured-section">
    <!-- Заголовок секции -->
    <div class="featured-section__header">
      <h3 class="featured-section__title">{{ title }}</h3>
    </div>

    <!-- Скелетон при загрузке -->
    <div v-if="loading" class="featured-section__carousel">
      <div
        v-for="i in 6"
        :key="`skeleton-${i}`"
        class="featured-section__skeleton-card"
      >
        <div class="featured-section__skeleton-cover" />
        <div class="featured-section__skeleton-line" />
        <div class="featured-section__skeleton-line featured-section__skeleton-line--short" />
      </div>
    </div>

    <!-- Пустое состояние -->
    <div
      v-else-if="items.length === 0"
      class="featured-section__empty"
    >
      <p class="featured-section__empty-text">Нет доступных элементов</p>
    </div>

    <!--
      Карусель.
      overflow-x: auto + flex + gap — нативный горизонтальный скролл
      без сторонних библиотек. scrollbar скрыт через .scrollbar-hide-true
      из глобальных стилей.
    -->
    <div v-else class="featured-section__carousel scrollbar-hide-true">
      <FeaturedCard
        v-for="enrichedItem in enrichedItems"
        :key="enrichedItem.id"
        :item="enrichedItem"
        :can-add="canAdd"
        @add="(status) => handleAdd(enrichedItem, status)"
        @update="(status) => handleUpdate(enrichedItem, status)"
      />
    </div>
  </section>
</template>

<style scoped>
.featured-section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* ── Заголовок ───────────────────────────────────────── */
.featured-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.featured-section__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

/* ── Карусель ────────────────────────────────────────── */
.featured-section__carousel {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  /* Плавный инерционный скролл на iOS */
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}

/* ── Скелетон ────────────────────────────────────────── */
.featured-section__skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex-shrink: 0;
  width: 120px;
}

.featured-section__skeleton-cover {
  width: 120px;
  height: 168px;
  border-radius: var(--border-radius-md);
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.featured-section__skeleton-line {
  height: 0.75rem;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.featured-section__skeleton-line--short {
  width: 60%;
}

/* ── Пустое состояние ────────────────────────────────── */
.featured-section__empty {
  padding: 1.5rem 0;
}

.featured-section__empty-text {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
</style>
