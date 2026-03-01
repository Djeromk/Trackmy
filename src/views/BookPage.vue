<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ExternalBook, MediaStatus, UserMedia } from "@/types";
import { BOOKS_STATUS_LABELS } from "@/types";
import { booksService } from "@/services/api/google-books";
import { useMediaStore } from "@/stores/media";
import Tag from "@/components/tag/tag.vue";
import Slider from "@/components/slider/slider.vue";
import {
  ArrowLeft,
  BookOpen,
  Star,
  Users,
  Hash,
  Calendar,
  FileText,
  Plus,
  ChevronDown,
  Check,
  Loader,
  Building2,
  Globe,
  ExternalLink,
} from "lucide-vue-next";
import fallbackImage from "@/assets/fallback.svg";

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const bookId: string = route.params.id as string;
const book = ref<ExternalBook | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const statusDropdownOpen = ref<boolean>(false);
const currentPage = ref<number | null | undefined>(0);

let currentPageTimeout: ReturnType<typeof setTimeout> | null = null;

const userMediaEntry = computed<UserMedia | null>(() => {
  return (
    mediaStore.userMedia.find((entry) => entry.media?.external_id === bookId) ??
    null
  );
});

const currentStatus = computed<MediaStatus | null>(() => {
  return userMediaEntry.value?.status ?? null;
});

const availableStatuses = computed<{ value: MediaStatus; label: string }[]>(
  () => {
    return (Object.entries(BOOKS_STATUS_LABELS) as [MediaStatus, string][]).map(
      ([value, label]) => ({ value, label }),
    );
  },
);

const publicationYear = computed<string | null>(() => {
  if (!book.value?.publishedDate) return null;
  return book.value.publishedDate.substring(0, 4);
});

onMounted(async () => {
  if (!bookId) {
    error.value = "ID книги не указан";
    loading.value = false;
    return;
  }
  try {
    book.value = await booksService.getBookById(bookId);
    // Инициализируем текущую страницу из сохранённых данных пользователя
    currentPage.value = userMediaEntry.value?.current_page;
  } catch (e) {
    const err = e as Error;
    error.value = err.message || "Не удалось загрузить книгу";
  } finally {
    loading.value = false;
  }
});

async function handleAddBook(status: MediaStatus) {
  if (!book.value) return;
  await mediaStore.addMediaFromExternal(book.value, "book", status);
  statusDropdownOpen.value = false;
}

async function handleUpdateStatus(status: MediaStatus) {
  if (!userMediaEntry.value) return;
  if (status === currentStatus.value) {
    statusDropdownOpen.value = false;
    return;
  }
  const updates = {
    status,
    is_finished: status === "completed",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };
  await mediaStore.updateMedia(userMediaEntry.value.id, updates);
  statusDropdownOpen.value = false;
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = fallbackImage;
}

watch(currentPage, (value) => {
  if (currentPageTimeout) clearTimeout(currentPageTimeout);
  currentPageTimeout = setTimeout(() => {
    if (!value) return;
    handleCurrentPageChange(value);
  }, 1000);
});

async function handleCurrentPageChange(value: number) {
  if (!userMediaEntry.value) return;
  await mediaStore.updateMedia(userMediaEntry.value.id, {
    currentPage: value,
  });
  currentPage.value = value;
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
      <!-- Состояние загрузки — полноэкранный спиннер -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-32 gap-4"
      >
        <Loader :size="40" class="text-(--primary-500) animate-spin" />
        <p class="text-sm text-(--text-tertiary)">Загрузка книги...</p>
      </div>

      <!-- Состояние ошибки с возможностью вернуться назад -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-32 gap-4"
      >
        <div
          class="w-16 h-16 rounded-full bg-(--gray-100) flex items-center justify-center"
        >
          <BookOpen :size="28" class="text-(--gray-400)" />
        </div>
        <p class="text-base font-medium text-(--text-primary)">{{ error }}</p>
        <button @click="router.back()" class="btn-secondary">
          Вернуться назад
        </button>
      </div>

      <!-- Основной контент страницы книги -->
      <div v-else-if="book" class="flex flex-col lg:flex-row gap-10">
        <!-- ═══════════════════════════════════
             ЛЕВАЯ КОЛОНКА: обложка + действия
             ═══════════════════════════════════ -->
        <div class="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          <!-- Обложка книги с тенью и скруглением -->
          <div class="relative group">
            <div
              class="w-full aspect-2/3 max-w-[180px] mx-auto lg:max-w-full rounded-2xl overflow-hidden shadow-(--shadow-lg) ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-[1.02]"
            >
              <img
                v-if="book.thumbnail"
                :src="book.thumbnail"
                :alt="book.title"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div
                v-else
                class="w-full h-full bg-(--gray-100) flex items-center justify-center"
              >
                <BookOpen :size="56" class="text-(--gray-300)" />
              </div>
            </div>
          </div>

          <!-- Блок управления статусом книги в списке пользователя -->
          <div class="relative">
            <!--
              Кнопка-триггер дропдауна.
              Зелёная обводка когда книга уже добавлена в список.
            -->
            <button
              @click="statusDropdownOpen = !statusDropdownOpen"
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 font-medium text-sm cursor-pointer"
              :class="
                currentStatus !== null
                  ? 'bg-(--primary-50) border-(--primary-300) text-(--primary-700) hover:bg-(--primary-100)'
                  : 'bg-white border-(--border-color) text-(--text-secondary) hover:border-(--primary-300) hover:bg-(--background-hover)'
              "
            >
              <span class="flex items-center gap-2">
                <span v-if="currentStatus">
                  {{ BOOKS_STATUS_LABELS[currentStatus] }}
                </span>
                <span v-else class="flex items-center gap-1.5">
                  <Plus :size="16" />
                  Добавить в список
                </span>
              </span>
              <ChevronDown
                :size="16"
                :class="[
                  'transition-transform duration-200 shrink-0',
                  statusDropdownOpen ? 'rotate-180' : '',
                ]"
              />
            </button>

            <!--
              Выпадающий список статусов.
              Появляется с анимацией через Transition.
            -->
            <Transition name="dropdown">
              <div
                v-if="statusDropdownOpen"
                class="absolute left-0 right-0 top-full mt-2 z-10 rounded-xl overflow-hidden border border-(--border-color) bg-white shadow-(--shadow-lg)"
              >
                <button
                  v-for="status in availableStatuses"
                  :key="status.value"
                  @click="
                    userMediaEntry
                      ? handleUpdateStatus(status.value)
                      : handleAddBook(status.value)
                  "
                  class="w-full px-4 py-3 text-left text-sm text-(--text-secondary) cursor-pointer hover:bg-(--background-hover) transition-colors flex items-center justify-between"
                  :class="{
                    'bg-(--primary-50) text-(--primary-700) font-medium':
                      currentStatus === status.value,
                  }"
                >
                  <span>{{ status.label }}</span>
                  <Check
                    v-if="currentStatus === status.value"
                    :size="16"
                    class="text-(--primary-600) shrink-0"
                  />
                </button>
              </div>
            </Transition>
          </div>

          <!--
            Слайдер текущей страницы.
            Показывается только если:
            - книга добавлена в список ("in_progress")
            - у книги есть общее количество страниц
          -->
          <div
            v-if="userMediaEntry?.status === 'in_progress' && book.pageCount"
            class="card-padded"
          >
            <p
              class="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-3"
            >
              Текущая страница
            </p>
            <Slider :max="book.pageCount" v-model="currentPage" />
          </div>

          <!-- Блок выставления рейтинга звёздами (1-5) -->
          <div v-if="userMediaEntry" class="card-padded">
            <p
              class="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-3"
            >
              Ваш рейтинг
            </p>
            <div class="flex gap-1">
              <button
                v-for="star in 5"
                :key="star"
                @click="
                  mediaStore.updateMedia(userMediaEntry.id, { rating: star })
                "
                class="cursor-pointer transition-all duration-150 hover:scale-125 active:scale-95"
              >
                <Star
                  :size="26"
                  :class="
                    star <= (userMediaEntry.rating ?? 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-(--gray-200) hover:text-amber-300'
                  "
                />
              </button>
            </div>
          </div>

          <!-- Мета-информация: ISBN, издатель, язык -->
          <div class="card-padded space-y-3">
            <div v-if="book.isbn" class="flex items-start gap-3">
              <Hash :size="15" class="text-(--primary-500) shrink-0 mt-0.5" />
              <div>
                <p class="text-xs text-(--text-tertiary) mb-0.5">ISBN</p>
                <p class="text-sm text-(--text-secondary) font-mono">
                  {{ book.isbn }}
                </p>
              </div>
            </div>
            <div v-if="book.publisher" class="flex items-start gap-3">
              <Building2
                :size="15"
                class="text-(--primary-500) shrink-0 mt-0.5"
              />
              <div>
                <p class="text-xs text-(--text-tertiary) mb-0.5">Издатель</p>
                <p class="text-sm text-(--text-secondary)">
                  {{ book.publisher }}
                </p>
              </div>
            </div>
            <div v-if="book.language" class="flex items-start gap-3">
              <Globe :size="15" class="text-(--primary-500) shrink-0 mt-0.5" />
              <div>
                <p class="text-xs text-(--text-tertiary) mb-0.5">Язык</p>
                <p class="text-sm text-(--text-secondary) uppercase">
                  {{ book.language }}
                </p>
              </div>
            </div>
          </div>

          <!-- Внешняя ссылка на Google Books -->
          <a
            v-if="book.infoLink"
            :href="book.infoLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-(--border-color) text-sm text-(--text-tertiary) hover:text-(--primary-600) hover:border-(--primary-300) hover:bg-(--primary-50) transition-all duration-200"
          >
            <ExternalLink :size="15" />
            <span>Открыть на Google Books</span>
          </a>
        </div>

        <!-- ═══════════════════════════════════
             ПРАВАЯ КОЛОНКА: детали книги
             ═══════════════════════════════════ -->
        <div class="flex-1 min-w-0 flex flex-col gap-6">
          <!-- Заголовок и основная мета -->
          <div>
            <h1 class="mb-3 leading-tight">{{ book.title }}</h1>

            <!-- Авторы, год, страницы — горизонтальный ряд тегов -->
            <div class="flex flex-wrap items-center gap-3">
              <div
                v-if="book.authors && book.authors.length > 0"
                class="flex items-center gap-1.5 text-(--text-secondary)"
              >
                <Users :size="15" class="text-(--primary-500)" />
                <span class="text-sm font-medium">{{
                  book.authors.join(", ")
                }}</span>
              </div>

              <span
                v-if="
                  book.authors?.length && (publicationYear || book.pageCount)
                "
                class="w-1 h-1 rounded-full bg-(--gray-300)"
              />

              <div
                v-if="publicationYear"
                class="flex items-center gap-1.5 text-(--text-secondary)"
              >
                <Calendar :size="15" class="text-(--primary-500)" />
                <span class="text-sm">{{ publicationYear }}</span>
              </div>

              <span
                v-if="publicationYear && book.pageCount"
                class="w-1 h-1 rounded-full bg-(--gray-300)"
              />

              <div
                v-if="book.pageCount"
                class="flex items-center gap-1.5 text-(--text-secondary)"
              >
                <FileText :size="15" class="text-(--primary-500)" />
                <span class="text-sm">{{ book.pageCount }} стр.</span>
              </div>
            </div>
          </div>

          <!-- Рейтинг Google Books с визуализацией звёзд -->
          <div
            v-if="book.averageRating"
            class="flex items-center gap-3 p-4 rounded-xl bg-(--primary-50) border border-(--primary-100)"
          >
            <div class="flex gap-0.5">
              <Star
                v-for="i in 5"
                :key="i"
                :size="18"
                :class="
                  i <= Math.round(book.averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-(--gray-200)'
                "
              />
            </div>
            <span class="text-sm font-semibold text-(--primary-700)">
              {{ book.averageRating.toFixed(1) }} / 5
            </span>
            <span class="text-xs text-(--text-tertiary)">Google Books</span>
          </div>

          <!-- Категории книги в виде тегов -->
          <div v-if="book.categories && book.categories.length > 0">
            <p
              class="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider mb-2"
            >
              Категории
            </p>
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="category in book.categories"
                :key="category"
                :label="category.split('/').join(' · ')"
              />
            </div>
          </div>

          <!--
            Описание книги.
            Рендерим как HTML — Google Books возвращает
            размеченный текст с тегами <br>, <b> и т.д.
          -->
          <div v-if="book.description" class="card-padded">
            <h2 class="text-base font-semibold text-(--text-primary) mb-4">
              Описание
            </h2>
            <div
              class="text-sm text-(--text-secondary) leading-relaxed prose-sm"
              v-html="book.description"
            />
          </div>

          <!-- Ссылки для предпросмотра -->
          <div
            v-if="book.previewLink || book.canonicalVolumeLink"
            class="card-padded"
          >
            <h2 class="text-base font-semibold text-(--text-primary) mb-4">
              Ссылки
            </h2>
            <div class="flex flex-col gap-3">
              <a
                v-if="book.previewLink"
                :href="book.previewLink"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm text-(--primary-600) hover:text-(--primary-700) hover:underline transition-colors"
              >
                <ExternalLink :size="15" />
                Предпросмотр книги
              </a>
              <a
                v-if="book.canonicalVolumeLink"
                :href="book.canonicalVolumeLink"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm text-(--primary-600) hover:text-(--primary-700) hover:underline transition-colors"
              >
                <ExternalLink :size="15" />
                Страница на Google Books
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Анимация появления дропдауна статуса снизу */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Стили для HTML-контента описания книги */
.prose-sm :deep(br) {
  display: block;
  margin-bottom: 0.5em;
  content: "";
}

.prose-sm :deep(b),
.prose-sm :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}
</style>
