<script setup lang="ts">

import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, BookOpen, Film, Gamepad2, X, Loader } from 'lucide-vue-next'
import type {
  MediaType,
  MediaStatus,
  ExternalMovie,
  ExternalBook,
  ExternalGame,
} from '@/types'
import { kinopoiskService } from '@/services/api/kinopoisk'
import { booksService } from '@/services/api/google-books'
import { gamesService } from '@/services/api/games'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import {
  getTitle,
  getImage,
  getSubtitle,
  getReleaseDate,
  getItemId,
  getAvailableStatuses,
  createImageErrorHandler,
} from '@/components/search/utils'
import StatusDropdown from '@/components/common/StatusDropdown.vue'
import fallbackImage from '@/assets/fallback.svg'

const router = useRouter()
const mediaStore = useMediaStore()
const authStore = useAuthStore()

interface CategoryConfig {
  type: MediaType
  label: string
  icon: typeof BookOpen
  placeholder: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    type: 'movie',
    label: 'Фильмы',
    icon: Film,
    placeholder: 'Поиск фильмов и сериалов...',
  },
  {
    type: 'book',
    label: 'Книги',
    icon: BookOpen,
    placeholder: 'Поиск книг...',
  },
  {
    type: 'game',
    label: 'Игры',
    icon: Gamepad2,
    placeholder: 'Поиск игр...',
  },
]

const selectedCategory = ref<MediaType | null>(null)
const query = ref('')
const results = ref<(ExternalMovie | ExternalBook | ExternalGame)[]>([])
const isLoading = ref(false)
const searchError = ref<string | null>(null)
const isDropdownOpen = ref(false)
const isMobileExpanded = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const inputWrapperRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const dropdownCoords = ref({ top: 0, left: 0, width: 0 })


const activeCategoryConfig = computed(
  () => CATEGORIES.find(c => c.type === selectedCategory.value) ?? null,
)
const inputPlaceholder = computed(() => {
  if (!selectedCategory.value) return 'Сначала выберите категорию...'
  return activeCategoryConfig.value?.placeholder ?? 'Поиск...'
})

/**
 * enrichedResults — результаты поиска, обогащённые данными из userMedia.
 * Для каждого результата проверяем есть ли он уже в списке пользователя
 * и какой у него статус — чтобы StatusDropdown показывал актуальное состояние.
 */
const enrichedResults = computed(() =>
  results.value.map(item => {
    const itemId = getItemId(item)
    const userMediaEntry = mediaStore.userMedia.find(
      um => um.media?.external_id === itemId,
    )
    return {
      item,
      id: itemId,
      isAdded: !!userMediaEntry,
      currentStatus: userMediaEntry?.status ?? null,
      userMediaId: userMediaEntry?.id ?? null,
    }
  }),
)

const availableStatuses = computed(() =>
  getAvailableStatuses(selectedCategory.value ?? undefined),
)

const handleImageError = createImageErrorHandler(fallbackImage)

// ─── Логика поиска ────────────────────────────────────────────────────────

/**
 * selectCategory — обработчик клика по кнопке категории.
 *
 * При смене категории:
 * 1. Сохраняем новую категорию
 * 2. Сбрасываем предыдущий запрос и результаты
 * 3. Фокусируем input чтобы пользователь сразу мог вводить
 *
 * Если кликнули на уже активную категорию — деактивируем её.
 * Это позволяет "закрыть" поиск без очистки строки.
 */
function selectCategory(type: MediaType) {
  if (selectedCategory.value === type) {
    // Повторный клик по активной — деактивируем
    selectedCategory.value = null
    query.value = ''
    results.value = []
    isDropdownOpen.value = false
    return
  }

  selectedCategory.value = type
  query.value = ''
  results.value = []
  searchError.value = null
  isDropdownOpen.value = false

  // Даём Vue обновить DOM перед фокусом
  setTimeout(() => inputRef.value?.focus(), 50)
}

/**
 * performSearch — выполняет запрос к соответствующему API.
 *
 * Вызывается только из debounced обработчика watch,
 * поэтому не нужен дополнительный debounce внутри.
 *
 * После успешного запроса:
 * - вычисляет координаты для dropdown
 * - открывает dropdown
 */
async function performSearch(searchQuery: string) {
  if (!selectedCategory.value || searchQuery.trim().length < 2) {
    results.value = []
    isDropdownOpen.value = false
    return
  }

  isLoading.value = true
  searchError.value = null

  try {
    let searchResults: (ExternalMovie | ExternalBook | ExternalGame)[] = []

    switch (selectedCategory.value) {
      case 'movie':
        searchResults = await kinopoiskService.searchMovies(searchQuery)
        break
      case 'book':
        searchResults = await booksService.searchBooks(searchQuery)
        break
      case 'game':
        searchResults = await gamesService.searchGames(searchQuery)
        break
    }

    results.value = searchResults
    recalculateDropdownCoords()
    isDropdownOpen.value = true
  } catch (e) {
    const err = e instanceof Error ? e : new Error('Ошибка поиска')
    searchError.value = err.message
    isDropdownOpen.value = true // показываем dropdown с ошибкой
  } finally {
    isLoading.value = false
  }
}

/**
 * recalculateDropdownCoords — вычисляет координаты для position: fixed dropdown.
 *
 * Используем getBoundingClientRect() вместо offsetTop/offsetLeft потому что:
 * - работает корректно когда шапка sticky/fixed
 * - учитывает transform и scroll
 * - возвращает координаты относительно viewport — то что нужно для fixed
 */
function recalculateDropdownCoords() {
  if (!inputWrapperRef.value) return
  const rect = inputWrapperRef.value.getBoundingClientRect()
  dropdownCoords.value = {
    top: rect.bottom + 6,
    left: rect.left,
    width: rect.width,
  }
}

/**
 * Watch на query с debounce 800мс.
 *
 * Логика:
 * 1. При каждом изменении query — сбрасываем предыдущий таймер
 * 2. Если строка короче 2 символов — сразу очищаем результаты
 * 3. Иначе — ждём 800мс и только потом запускаем запрос
 *
 * 800мс выбрано как баланс между отзывчивостью и экономией API-лимитов:
 * быстрые слова типа "Дюн" (3 символа) пользователь обычно вводит быстрее
 * чем за 800мс, поэтому запрос летит один раз по завершении ввода.
 */
watch(query, newQuery => {
  // Сбрасываем предыдущий таймер при каждом новом символе
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (!newQuery || newQuery.trim().length < 2) {
    results.value = []
    searchError.value = null
    isDropdownOpen.value = false
    return
  }

  // Запускаем поиск через 800мс после последнего нажатия
  debounceTimer = setTimeout(() => {
    performSearch(newQuery.trim())
  }, 800)
})

// ─── Добавление в список ──────────────────────────────────────────────────

/**
 * handleStatusSelect — обработчик выбора статуса из StatusDropdown.
 *
 * Два сценария:
 * 1. Элемент уже добавлен (isAdded) — обновляем статус через updateMedia
 * 2. Элемент новый — добавляем через addMediaFromExternal
 *
 * После успешного добавления закрываем dropdown и очищаем поиск —
 * пользователь сделал что хотел, чистый UX.
 */
async function handleStatusSelect(
  result: (typeof enrichedResults.value)[number],
  status: MediaStatus,
) {
  if (!authStore.isAuthenticated || !selectedCategory.value) return

  if (result.isAdded && result.userMediaId) {
    // Обновляем статус существующей записи
    await mediaStore.updateMedia(result.userMediaId, {
      status,
      is_finished: status === 'completed' || status === 'dropped',
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
  } else {
    // Добавляем новый элемент в список пользователя
    await mediaStore.addMediaFromExternal(result.item, selectedCategory.value, status)
  }
}

// ─── Навигация в результатах ──────────────────────────────────────────────

/**
 * navigateToItem — переход на страницу детального просмотра.
 * Закрываем dropdown и сбрасываем поиск после навигации.
 */
function navigateToItem(itemId: string) {
  if (!selectedCategory.value) return
  router.push(`/${selectedCategory.value}s/${itemId}`)
  closeDropdown()
}

// ─── Управление видимостью ────────────────────────────────────────────────

/** closeDropdown — закрывает выпадающий список без сброса query */
function closeDropdown() {
  isDropdownOpen.value = false
}

/** clearSearch — полностью сбрасывает состояние поиска */
function clearSearch() {
  query.value = ''
  results.value = []
  searchError.value = null
  isDropdownOpen.value = false
  selectedCategory.value = null
}

/**
 * toggleMobileSearch — переключает видимость поиска на мобильных.
 * При открытии фокусируемся на input через небольшой таймаут (ждём анимацию).
 */
function toggleMobileSearch() {
  isMobileExpanded.value = !isMobileExpanded.value
  if (isMobileExpanded.value) {
    setTimeout(() => inputRef.value?.focus(), 150)
  } else {
    clearSearch()
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────

/**
 * onUnmounted — очищаем таймер debounce при уничтожении компонента.
 * Без этого таймер сработает после unmount и попытается обновить
 * уже уничтоженный реактивный ref — это приведёт к утечке памяти.
 */
onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <!--
    Корневой элемент — flex-контейнер для десктопной версии.
    На мобильных содержит только иконку лупы; раскрытая версия
    рендерится отдельным блоком через v-if.
  -->
  <div class="header-search">

    <!-- ── ДЕСКТОП: строка поиска всегда видна (≥ 768px) ──────────────── -->
    <div class="header-search__desktop" ref="inputWrapperRef">

      <!-- Три кнопки-категории слева от input -->
      <div class="header-search__categories">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.type"
          type="button"
          class="header-search__cat-btn"
          :class="{
            'header-search__cat-btn--active': selectedCategory === cat.type,
          }"
          :title="cat.label"
          @click="selectCategory(cat.type)"
        >
          <component :is="cat.icon" :size="15" />
          <span class="header-search__cat-label">{{ cat.label }}</span>
        </button>
      </div>

      <!-- Разделитель -->
      <div class="header-search__divider" />

      <!-- Поле ввода -->
      <div class="header-search__input-wrap">
        <!--
          Иконка лупы или спиннер загрузки.
          Спиннер появляется пока идёт запрос к API —
          пользователь видит что система работает.
        -->
        <Loader
          v-if="isLoading"
          :size="15"
          class="header-search__icon header-search__icon--spin"
        />
        <Search
          v-else
          :size="15"
          class="header-search__icon"
          :class="{ 'header-search__icon--active': selectedCategory }"
        />

        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="header-search__input"
          :placeholder="inputPlaceholder"
          :disabled="!selectedCategory"
          autocomplete="off"
          @focus="query.length >= 2 && results.length > 0 && (isDropdownOpen = true)"
          @keydown.escape="closeDropdown"
        />

        <!-- Кнопка очистки — появляется когда есть текст -->
        <button
          v-if="query"
          type="button"
          class="header-search__clear"
          title="Очистить поиск"
          @click="clearSearch"
        >
          <X :size="13" />
        </button>
      </div>
    </div>

    <!-- ── МОБИЛЬНЫЕ: иконка лупы (< 768px) ──────────────────────────── -->
    <button
      type="button"
      class="header-search__mobile-trigger"
      :class="{ 'header-search__mobile-trigger--active': isMobileExpanded }"
      title="Поиск"
      @click="toggleMobileSearch"
    >
      <X v-if="isMobileExpanded" :size="18" />
      <Search v-else :size="18" />
    </button>

    <!-- ── МОБИЛЬНЫЕ: раскрытая панель поиска ─────────────────────────── -->
    <Transition name="mobile-search">
      <div v-if="isMobileExpanded" class="header-search__mobile-panel">
        <!-- Кнопки категорий -->
        <div class="header-search__mobile-categories">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.type"
            type="button"
            class="header-search__mobile-cat-btn"
            :class="{
              'header-search__mobile-cat-btn--active': selectedCategory === cat.type,
            }"
            @click="selectCategory(cat.type)"
          >
            <component :is="cat.icon" :size="14" />
            <span>{{ cat.label }}</span>
          </button>
        </div>

        <!-- Input для мобильных — отдельный ref чтобы не конфликтовать с десктопом -->
        <div class="header-search__mobile-input-wrap" ref="inputWrapperRef">
          <Loader
            v-if="isLoading"
            :size="14"
            class="header-search__icon header-search__icon--spin"
          />
          <Search v-else :size="14" class="header-search__icon" />

          <input
            v-model="query"
            type="text"
            class="header-search__mobile-input"
            :placeholder="inputPlaceholder"
            :disabled="!selectedCategory"
            autocomplete="off"
            @keydown.escape="toggleMobileSearch"
          />

          <button
            v-if="query"
            type="button"
            class="header-search__clear"
            @click="() => { query = ''; results = []; isDropdownOpen = false }"
          >
            <X :size="13" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── DROPDOWN: результаты поиска (через Teleport) ───────────────── -->
    <!--
      Teleport необходим потому что шапка имеет overflow: hidden или
      z-index контексты которые могут обрезать/перекрыть выпадающий список.
      Рендерим dropdown прямо в <body> и позиционируем через fixed.
    -->
    <Teleport to="body">
      <!-- Полупрозрачный overlay — клик по нему закрывает dropdown -->
      <div
        v-if="isDropdownOpen"
        class="header-search__overlay"
        @click="closeDropdown"
      />

      <Transition name="search-dropdown">
        <div
          v-if="isDropdownOpen"
          class="header-search__dropdown"
          :style="{
            top: dropdownCoords.top + 'px',
            left: dropdownCoords.left + 'px',
            width: Math.max(dropdownCoords.width, 320) + 'px',
          }"
        >

          <!-- Состояние загрузки -->
          <div v-if="isLoading" class="header-search__dropdown-loading">
            <Loader :size="20" class="header-search__icon--spin" style="color: var(--primary-500)" />
            <span>Поиск...</span>
          </div>

          <!-- Состояние ошибки -->
          <div v-else-if="searchError" class="header-search__dropdown-empty">
            <p class="text-sm" style="color: var(--error-500)">{{ searchError }}</p>
          </div>

          <!-- Пустой результат -->
          <div
            v-else-if="enrichedResults.length === 0"
            class="header-search__dropdown-empty"
          >
            <p class="text-sm" style="color: var(--text-tertiary)">Ничего не найдено</p>
          </div>

          <!-- Список результатов -->
          <ul v-else class="header-search__results">
            <li
              v-for="result in enrichedResults"
              :key="result.id"
              class="header-search__result-item"
            >
              <!-- Обложка — клик ведёт на страницу детального просмотра -->
              <button
                type="button"
                class="header-search__result-cover"
                @click="navigateToItem(result.id)"
              >
                <img
                  v-if="getImage(result.item)"
                  :src="getImage(result.item)!"
                  :alt="getTitle(result.item)"
                  loading="lazy"
                  class="header-search__result-img"
                  @error="handleImageError"
                />
                <div v-else class="header-search__result-cover-fallback">📄</div>
              </button>

              <!-- Мета-информация -->
              <div class="header-search__result-meta">
                <button
                  type="button"
                  class="header-search__result-title"
                  @click="navigateToItem(result.id)"
                >
                  {{ getTitle(result.item) }}
                </button>
                <p
                  v-if="getSubtitle(result.item)"
                  class="header-search__result-subtitle"
                >
                  {{ getSubtitle(result.item) }}
                </p>
                <p
                  v-if="getReleaseDate(result.item)"
                  class="header-search__result-year"
                >
                  {{ getReleaseDate(result.item) }}
                </p>
              </div>

              <!--
                StatusDropdown справа — добавить в список или сменить статус.
                Показывается только авторизованным не-демо пользователям.
                Демо-пользователям нет смысла давать добавление —
                данные не сохранятся после закрытия сессии.
              -->
              <div
                v-if="authStore.isAuthenticated && !authStore.isDemoUser"
                class="header-search__result-action"
                @click.stop
              >
                <StatusDropdown
                  :current-status="result.currentStatus"
                  :available-statuses="availableStatuses"
                  :placeholder-text="'Добавить'"
                  :compact="true"
                  :button-class="result.isAdded ? 'border-green-400 bg-green-50 text-green-700' : ''"
                  @select="(status) => handleStatusSelect(result, status)"
                />
              </div>
            </li>
          </ul>

        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════
   КОРНЕВОЙ КОНТЕЙНЕР
   ═══════════════════════════════════════════════════════ */

.header-search {
  display: flex;
  align-items: center;
  position: relative;
}

/* ═══════════════════════════════════════════════════════
   ДЕСКТОП (≥ 768px)
   ═══════════════════════════════════════════════════════ */

.header-search__desktop {
  /*
    Скрыт на мобильных, виден на десктопе.
    display: none задаётся ниже через медиазапрос.
  */
  display: none;
  align-items: center;
  height: 38px;
  background-color: var(--background-subtle);
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.header-search__desktop:focus-within {
  border-color: var(--primary-300);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 12%, transparent);
}

/* ── Кнопки категорий ────────────────────────────────── */

.header-search__categories {
  display: flex;
  align-items: center;
  padding: 0 0.25rem;
  gap: 0.125rem;
  flex-shrink: 0;
}

.header-search__cat-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  white-space: nowrap;
  font-family: var(--font-sans);
}

.header-search__cat-btn:hover {
  background-color: var(--background-hover);
  color: var(--text-secondary);
}

.header-search__cat-btn--active {
  background-color: var(--primary-50);
  color: var(--primary-700);
}

.dark .header-search__cat-btn--active {
  background-color: var(--primary-100);
  color: var(--primary-500);
}

/* Метка скрывается при ширине < 900px чтобы не переполнять шапку */
.header-search__cat-label {
  display: none;
}

/* ── Разделитель между категориями и input ───────────── */

.header-search__divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color);
  flex-shrink: 0;
}

/* ── Поле ввода ──────────────────────────────────────── */

.header-search__input-wrap {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.625rem;
  flex: 1;
  min-width: 0;
}

.header-search__icon {
  color: var(--text-disabled);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.header-search__icon--active {
  color: var(--primary-500);
}

/* Анимация вращения для спиннера загрузки */
.header-search__icon--spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.header-search__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  color: var(--text-primary);
  width: 180px;
}

.header-search__input::placeholder {
  color: var(--text-disabled);
  font-size: var(--text-xs);
}

.header-search__input:disabled {
  cursor: not-allowed;
}

.header-search__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background-color: var(--gray-300);
  color: var(--text-inverse);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color var(--transition-fast);
}

.header-search__clear:hover {
  background-color: var(--gray-400);
}

/* ═══════════════════════════════════════════════════════
   МОБИЛЬНЫЕ (< 768px)
   ═══════════════════════════════════════════════════════ */

/* Иконка лупы — только на мобильных */
.header-search__mobile-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-base);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-search__mobile-trigger:hover,
.header-search__mobile-trigger--active {
  background-color: var(--background-hover);
  color: var(--text-primary);
}

/* Раскрытая мобильная панель поиска — под шапкой */
.header-search__mobile-panel {
  position: fixed;
  top: 64px; /* высота шапки h-16 */
  left: 0;
  right: 0;
  z-index: calc(var(--z-dropdown) - 1);
  background-color: var(--background-card);
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  box-shadow: var(--shadow-md);
}

.header-search__mobile-categories {
  display: flex;
  gap: 0.5rem;
}

.header-search__mobile-cat-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--border-radius-full);
  border: 1px solid var(--border-color);
  background-color: var(--background-subtle);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  white-space: nowrap;
}

.header-search__mobile-cat-btn:hover {
  border-color: var(--primary-300);
  color: var(--primary-600);
}

.header-search__mobile-cat-btn--active {
  background-color: var(--primary-50);
  border-color: var(--primary-300);
  color: var(--primary-700);
}

.dark .header-search__mobile-cat-btn--active {
  background-color: var(--primary-100);
  border-color: var(--primary-400);
  color: var(--primary-500);
}

.header-search__mobile-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--background-subtle);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-base);
  transition: border-color var(--transition-fast);
}

.header-search__mobile-input-wrap:focus-within {
  border-color: var(--primary-400);
}

.header-search__mobile-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  color: var(--text-primary);
}

.header-search__mobile-input::placeholder {
  color: var(--text-disabled);
}

.header-search__mobile-input:disabled {
  cursor: not-allowed;
}

/* ═══════════════════════════════════════════════════════
   МЕДИАЗАПРОСЫ — включаем десктопную версию
   ═══════════════════════════════════════════════════════ */

@media (min-width: 768px) {
  .header-search__desktop {
    display: flex;
  }

  /* На мобильной кнопке лупы — скрываем на десктопе */
  .header-search__mobile-trigger {
    display: none;
  }
}

/* На широких экранах показываем метки у кнопок */
@media (min-width: 1024px) {
  .header-search__cat-label {
    display: inline;
  }

  .header-search__input {
    width: 220px;
  }
}
</style>

<!--
  Стили для Teleport-элементов — вне <body> компонента,
  поэтому scoped не работает, используем глобальный блок <style>.
-->
<style>
/* ── Overlay под dropdown ────────────────────────────── */
.header-search__overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-dropdown) - 1);
  background: transparent;
}

/* ── Выпадающий список результатов ──────────────────── */
.header-search__dropdown {
  position: fixed;
  z-index: var(--z-dropdown);
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--gray-300) transparent;
}

.header-search__dropdown-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1.5rem;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.header-search__dropdown-empty {
  padding: 1.5rem;
  text-align: center;
}

/* ── Список результатов ──────────────────────────────── */
.header-search__results {
  list-style: none;
  padding: 0.375rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.header-search__result-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--border-radius-base);
  transition: background-color var(--transition-fast);
}

.header-search__result-item:hover {
  background-color: var(--background-hover);
}

/* ── Обложка ─────────────────────────────────────────── */
.header-search__result-cover {
  /* width: 36px;
  height: 50px; */
  min-width: 40px;
  max-width: 60px;
  aspect-ratio: 2 / 3;
  width: clamp(40px, 10vw, 60px);
  flex-shrink: 0;
  flex-shrink: 0;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background-color: var(--gray-100);
  border: none;
  padding: 0;
  cursor: pointer;
}

.header-search__result-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.header-search__result-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
}

/* ── Мета-данные ─────────────────────────────────────── */
.header-search__result-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.header-search__result-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  /* Обрезаем длинные названия в одну строку */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  font-family: var(--font-sans);
  transition: color var(--transition-fast);
}

.header-search__result-title:hover {
  color: var(--primary-600);
}

.header-search__result-subtitle {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-search__result-year {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  margin: 0;
}

/* ── Кнопка добавления ───────────────────────────────── */
.header-search__result-action {
  flex-shrink: 0;
}

/* ── Анимации ────────────────────────────────────────── */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition:
    opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.mobile-search-enter-active,
.mobile-search-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.mobile-search-enter-from,
.mobile-search-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
