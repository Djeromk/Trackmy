<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, Trash2, MoreHorizontal } from 'lucide-vue-next'
import type { MediaStatus, UserMedia } from '@/types'
import { STATUS_LABELS, MEDIA_TYPE_LABELS } from '@/types'
import fallbackImage from '@/assets/fallback.svg'

/**
 * MediaListItem — карточка одного медиа-элемента внутри аккордеона.
 * Содержит: обложку, название, тип, рейтинг, управление статусом и удалением.
 */
interface Props {
  item: UserMedia
  currentStatus: MediaStatus
}

interface Emits {
  (e: 'update-status', id: string, status: MediaStatus): void
  (e: 'delete-item', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** Открыт ли дропдаун смены статуса */
const isStatusDropdownOpen = ref(false)

/** Открыто ли модальное окно подтверждения удаления */
const isDeleteModalOpen = ref(false)

/**
 * Все статусы кроме текущего — доступны для переключения.
 * Фильтруем и маппируем в { value, label }.
 */
const availableStatuses = computed(() => {
  const statuses: MediaStatus[] = ['backlog', 'in_progress', 'completed', 'dropped']
  return statuses
    .filter(s => s !== props.currentStatus)
    .map(s => ({ value: s, label: STATUS_LABELS[s] }))
})

/**
 * URL обложки медиа. Поддерживаем оба варианта поля:
 * camelCase (coverUrl) и snake_case (cover_url) — из-за особенностей Supabase.
 */
const coverUrl = computed(() => {
  return props.item.media?.coverUrl || props.item.media?.cover_url || fallbackImage
})

/** Название медиа или заглушка */
const mediaTitle = computed(() => props.item.media?.title || 'Без названия')

/** Читаемый тип медиа (Фильм, Книга, Игра) */
const mediaTypeLabel = computed(() => {
  const type = props.item.media?.type
  return type ? MEDIA_TYPE_LABELS[type] : 'Неизвестно'
})

/** Тип медиа для формирования ссылки (movies, books, games) */
const mediaType = computed(() => props.item.media?.type)

/** Заменяем сломанное изображение на fallback-SVG */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = fallbackImage
}

function toggleStatusDropdown() {
  isStatusDropdownOpen.value = !isStatusDropdownOpen.value
}

function handleStatusChange(newStatus: MediaStatus) {
  emit('update-status', props.item.id, newStatus)
  isStatusDropdownOpen.value = false
}

function confirmDelete() {
  emit('delete-item', props.item.id)
  isDeleteModalOpen.value = false
}
</script>

<template>
  <div class="relative group">
    <div class="flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-(--background-hover)">

      <!-- Обложка: прямоугольный постер с соотношением сторон 2:3 -->
      <router-link
        :to="`/${mediaType}s/${item.media?.external_id}`"
        class="shrink-0"
      >
        <div class="w-10 h-14 rounded-lg overflow-hidden bg-(--gray-100) shadow-(--shadow-xs) ring-1 ring-black/5 transition-transform duration-200 hover:scale-105">
          <img
            :src="coverUrl"
            :alt="mediaTitle"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>
      </router-link>

      <!-- Основной контент: название, тип, рейтинг -->
      <div class="flex-1 min-w-0">
        <router-link :to="`/${mediaType}s/${item.media?.external_id}`">
          <h4 class="text-sm font-semibold text-(--text-primary) truncate leading-snug mb-0.5 hover:text-(--primary-600) transition-colors">
            {{ mediaTitle }}
          </h4>
        </router-link>
        <p class="text-xs text-(--text-tertiary)">{{ mediaTypeLabel }}</p>

        <!-- Звёздный рейтинг — показываем только если выставлен -->
        <div v-if="item.rating" class="flex items-center gap-1 mt-1.5">
          <span class="text-amber-400 text-xs">★</span>
          <span class="text-xs font-medium text-(--text-secondary)">{{ item.rating }}/5</span>
        </div>
      </div>

      <!-- Панель действий: смена статуса + удаление -->
      <div class="flex items-center gap-2 shrink-0">

        <!-- Кнопка смены статуса с дропдауном -->
        <div class="relative">
          <button
            @click="toggleStatusDropdown"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--border-color) bg-(--primary-400) text-xs font-medium hover:border-(--primary-300) hover:text-(--primary-foreground) hover:bg-(--primary-600) transition-all duration-150 cursor-pointer"
          >
            <span class="hidden sm:inline">Статус</span>
            <ChevronDown
              :size="14"
              :class="[
                'transition-transform duration-200',
                isStatusDropdownOpen ? 'rotate-180' : ''
              ]"
            />
          </button>

          <!-- Дропдаун со списком статусов -->
          <Transition name="dropdown">
            <div
              v-if="isStatusDropdownOpen"
              class="absolute right-0 top-full mt-1.5 w-44 bg-(--background) rounded-xl border border-(--border-color) shadow-(--shadow-lg) overflow-hidden z-20"
              @click.stop
            >
              <button
                v-for="status in availableStatuses"
                :key="status.value"
                @click="handleStatusChange(status.value)"
                class="w-full px-4 py-2.5 text-left text-xs text-(--text-secondary) hover:bg-(--background-hover) hover:text-(--text-primary) transition-colors cursor-pointer"
              >
                {{ status.label }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Кнопка удаления — красный hover -->
        <button
          @click="isDeleteModalOpen = true"
          class="p-1.5 rounded-lg text-(--text-tertiary) hover:text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100"
          title="Удалить из списка"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════
         МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ
         ═══════════════════════════════════ -->
    <Transition name="modal">
      <div
        v-if="isDeleteModalOpen"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="isDeleteModalOpen = false"
      >
        <div
          class="bg-white rounded-2xl shadow-(--shadow-xl) max-w-sm w-full p-6 animate-scale-in"
          @click.stop
        >
          <!-- Иконка предупреждения -->
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 :size="22" class="text-red-500" />
          </div>

          <h3 class="text-base font-semibold text-(--text-primary) text-center mb-1">
            Удалить из списка?
          </h3>
          <p class="text-sm text-(--text-tertiary) text-center mb-6">
            «{{ mediaTitle }}» будет удалён. Это действие нельзя отменить.
          </p>

          <!-- Кнопки действий -->
          <div class="flex gap-3">
            <button
              @click="isDeleteModalOpen = false"
              class="flex-1 px-4 py-2.5 rounded-xl border border-(--border-color) text-sm font-medium text-(--text-secondary) hover:bg-(--background-hover) transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              @click="confirmDelete"
              class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Дропдаун статусов */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Оверлей модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
