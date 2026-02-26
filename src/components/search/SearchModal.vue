<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  MediaType,
  MediaStatus,
  ExternalBook,
  ExternalGame,
  ExternalMovie,
} from "@/types";
import {
  getItemId,
  getTitle,
  getImage,
  getMetacritic,
  getReleaseDate,
  getSubtitle,
  getSearchPlaceholder,
  getAvailableStatuses,
  getStatusIcon,
  getStatusLabel,
  isCurrentStatus,
  createImageErrorHandler,
} from "./utils";
import { kinopoiskService } from "@/services/api/kinopoisk";
import { booksService } from "@/services/api/google-books";
import { gamesService } from "@/services/api/games";
import { useMediaStore } from "@/stores/media";
import { MEDIA_TYPE_LABELS } from "@/types";
import fallbackImage from "@/assets/fallback.svg";
import {
  X,
  ChevronDown,
  Check,
  Archive,
  ClockFading,
  CircleCheckBig,
} from "lucide-vue-next";

interface Props {
  mediaType: MediaType;
}

interface Emits {
  (e: "close"): void;
  (
    e: "select",
    item: ExternalMovie | ExternalBook | ExternalGame,
    status: MediaStatus,
  ): void;
}

/**
 * Интерфейс для обогащённого результата поиска.
 * Хранит оригинальный элемент медиа + информацию о его состоянии
 * в коллекции текущего пользователя.
 */
interface EnrichedSearchResult {
  item: ExternalMovie | ExternalBook | ExternalGame;
  /** Внешний ID из стороннего API — используется как ключ для v-for и поиска совпадений */
  id: string;
  /** true если этот элемент уже добавлен в коллекцию пользователя */
  isAdded: boolean;
  /** Текущий статус в коллекции, null если элемент не добавлен */
  currentStatus: MediaStatus | null;
  /** ID записи в таблице user_media — нужен для обновления статуса */
  userMediaId: string | null;
}

/**
 * Координаты дропдауна в пространстве viewport (для position:fixed).
 * Вычисляются через getBoundingClientRect() кнопки, которая его открывает.
 * top — нижний край кнопки + отступ, right — расстояние от правого края viewport.
 */
interface DropdownCoords {
  top: number;
  right: number;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref("");
const mediaStore = useMediaStore();
const searchResults = ref<(ExternalMovie | ExternalBook | ExternalGame)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/**
 * ID элемента, у которого открыт дропдаун статуса.
 * null — все дропдауны закрыты.
 */
const activeDropdown = ref<string | null>(null);

/**
 * Текущие координаты дропдауна.
 * Обновляются в toggleDropdown() каждый раз при открытии нового дропдауна.
 */
const dropdownCoords = ref<DropdownCoords>({ top: 0, right: 0 });

/** Таймер debounce — чтобы не делать запрос после каждого нажатия клавиши */
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Computed: обогащённые результаты поиска.
 *
 * Берём сырые результаты из API и для каждого проверяем,
 * есть ли он в коллекции пользователя (mediaStore.userMedia).
 * Сравнение по media.external_id — ID из внешнего API, который
 * сохраняется при добавлении элемента в коллекцию.
 *
 * Вынесено в computed, чтобы template не вызывал эти вычисления
 * заново для каждого элемента при каждом рендере.
 */
const enrichedResults = computed<EnrichedSearchResult[]>(() => {
  return searchResults.value.map((item) => {
    const itemId = getItemId(item);
    const userMediaItem = mediaStore.userMedia.find(
      (userMedia) => userMedia.media?.external_id === itemId,
    );
    return {
      item,
      id: itemId,
      isAdded: !!userMediaItem,
      currentStatus: userMediaItem?.status ?? null,
      userMediaId: userMediaItem?.id ?? null,
    };
  });
});

/** Список доступных статусов зависит от типа медиа */
const availableStatuses = computed(() => getAvailableStatuses(props.mediaType));

/** Плейсхолдер поля ввода зависит от типа медиа */
const placeholder = computed(() => getSearchPlaceholder(props.mediaType));

/**
 * Активный результат — элемент, чей дропдаун сейчас открыт.
 * Нужен в блоке Teleport: он находится вне v-for и не имеет
 * прямого доступа к переменной result текущей итерации.
 */
const activeResult = computed<EnrichedSearchResult | undefined>(() =>
  enrichedResults.value.find((r) => r.id === activeDropdown.value),
);

/**
 * Возвращает Vue-компонент иконки по строковому имени.
 *
 * getStatusIcon() возвращает строку ("Archive", "ClockFading", ...),
 * а не компонент напрямую — это позволяет хранить конфигурацию статусов
 * в обычном JS-объекте без зависимости от Vue.
 * Здесь маппим имя обратно в компонент.
 * Возвращает null если имя не найдено — защита от опечаток.
 */
function getIconComponent(
  iconName: string,
): typeof Archive | typeof ClockFading | typeof CircleCheckBig | null {
  const icons: Record<
    string,
    typeof Archive | typeof ClockFading | typeof CircleCheckBig
  > = {
    Archive,
    ClockFading,
    CircleCheckBig,
  };
  return icons[iconName] ?? null;
}

/**
 * Watcher с debounce (1 сек) — запускает поиск после паузы в наборе.
 * Минимальная длина запроса 2 символа, иначе очищаем результаты.
 */
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!newQuery || newQuery.length < 2) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(() => {
    performSearch(newQuery);
  }, 1000);
});

/**
 * Запрашивает результаты поиска через нужный API-сервис
 * в зависимости от типа медиа.
 */
async function performSearch(query: string) {
  loading.value = true;
  error.value = null;
  try {
    let results: (ExternalMovie | ExternalBook | ExternalGame)[] = [];

    switch (props.mediaType) {
      case "book":
        results = await booksService.searchBooks(query);
        break;
      case "movie":
        results = await kinopoiskService.searchMovies(query);
        break;
      case "game":
        results = await gamesService.searchGames(query);
        break;
    }

    searchResults.value = results;
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Неизвестная ошибка");
    error.value = err.message || "Ошибка поиска";
  } finally {
    loading.value = false;
  }
}

/**
 * Закрывает модальное окно: сбрасывает все состояния и уведомляет родителя.
 */
function handleClose() {
  searchQuery.value = "";
  searchResults.value = [];
  activeDropdown.value = null;
  emit("close");
}

/** Заменяет сломанное изображение обложки на fallback.svg */
const handleImageError = createImageErrorHandler(fallbackImage);

/**
 * Открывает/закрывает дропдаун для конкретного элемента.
 *
 * При открытии измеряем координаты кнопки через getBoundingClientRect()
 * и сохраняем в dropdownCoords. Дропдаун рендерится через Teleport в <body>
 * с position:fixed — поэтому нужны координаты относительно viewport.
 *
 * Teleport нужен, чтобы overflow:auto/hidden на родительских контейнерах
 * (скролл-список, модалка) не обрезали дропдаун визуально.
 *
 * @param itemId — ID элемента в списке результатов
 * @param event  — MouseEvent клика на кнопку; из currentTarget берём HTMLElement
 */
function toggleDropdown(itemId: string, event: MouseEvent) {
  // Закрываем если уже открыт
  if (activeDropdown.value === itemId) {
    activeDropdown.value = null;
    return;
  }

  // Измеряем позицию кнопки и вычисляем куда разместить дропдаун.
  // right считается как расстояние от правого края viewport до правого края кнопки —
  // это нужно для CSS свойства right в position:fixed, чтобы правый край
  // дропдауна совпадал с правым краем кнопки.
  const button = event.currentTarget as HTMLButtonElement;
  const rect = button.getBoundingClientRect();

  // Примерная высота дропдауна: количество статусов × высота одного пункта (44px) + padding (8px)
  const estimatedDropdownHeight = availableStatuses.value.length * 44 + 8;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < estimatedDropdownHeight;

  dropdownCoords.value = {
    top: openUpward ? rect.top - estimatedDropdownHeight - 6 : rect.bottom + 6,
    right: window.innerWidth - rect.right,
  };

  activeDropdown.value = itemId;
}

/**
 * Обрабатывает выбор статуса из дропдауна.
 *
 * Три сценария:
 * 1. Статус уже установлен — ничего не делаем, закрываем дропдаун.
 * 2. Элемент в коллекции, но статус другой — обновляем через store.
 * 3. Элемент ещё не добавлен — эмитим "select" родителю, тот добавляет в коллекцию.
 */
async function handleSelectWithStatus(
  result: EnrichedSearchResult,
  status: MediaStatus,
) {
  if (result.isAdded && result.currentStatus === status) {
    activeDropdown.value = null;
    return;
  }

  if (result.isAdded && result.userMediaId) {
    await mediaStore.updateMedia(result.userMediaId, {
      status,
      is_finished: status === "completed",
      completed_at: status === "completed" ? new Date().toISOString() : null,
    });
    activeDropdown.value = null;
    return;
  }

  emit("select", result.item, status);
  activeDropdown.value = null;
  handleClose();
}

const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
  },
};
</script>

<template>
  <!-- Overlay: затемнённый фон; клик вне модалки закрывает её -->
  <Transition name="fade">
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <!--
        Модальное окно.
        flex flex-col + overflow-hidden: шапка и поле поиска зафиксированы сверху,
        список результатов скроллится независимо внутри.
        Клик по модалке (но не по строкам) закрывает открытый дропдаун.
      -->
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        @click="activeDropdown = null"
      >
        <!-- Шапка (не скроллится) -->
        <div
          class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0"
        >
          <h2 class="text-lg font-bold text-gray-900">
            Добавить {{ MEDIA_TYPE_LABELS[mediaType] }}
          </h2>
          <button
            @click="handleClose"
            class="w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Поле поиска (не скроллится) -->
        <div class="px-6 py-3 shrink-0">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="placeholder"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all text-sm"
            autofocus
            v-focus
            @click.stop
          />
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="flex justify-center py-10 flex-1">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
          />
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="text-center py-10 flex-1 px-6">
          <p class="text-sm text-red-500">{{ error }}</p>
        </div>

        <!-- Список результатов со скроллом -->
        <div
          v-else-if="enrichedResults.length > 0"
          class="overflow-y-auto flex-1 px-4 pb-3"
        >
          <div class="space-y-0.5 pt-1">
            <div
              v-for="result in enrichedResults"
              :key="result.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              @click.stop
            >
              <!-- Обложка -->
              <div
                class="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm"
              >
                <img
                  v-if="getImage(result.item)"
                  :src="getImage(result.item)!"
                  :alt="getTitle(result.item)"
                  loading="lazy"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-gray-300 text-base"
                >
                  📄
                </div>
              </div>

              <!-- Информация -->
              <div class="flex-1 min-w-0">
                <router-link :to="`/${mediaType}s/${result.item.id}`">
                  <h3
                    class="font-semibold text-sm text-gray-900 truncate hover:text-primary-600 transition-colors leading-snug"
                  >
                    {{ getTitle(result.item) }}
                  </h3>
                </router-link>

                <p class="text-xs text-gray-500 mt-0.5 truncate leading-tight">
                  {{ getSubtitle(result.item) }}
                </p>

                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-xs text-gray-400">
                    {{ getReleaseDate(result.item) }}
                  </span>

                  <!-- Metacritic для игр -->
                  <span
                    v-if="
                      mediaType === 'game' &&
                      'metacritic' in result.item &&
                      result.item.metacritic &&
                      result.item.metacritic > 0
                    "
                    class="inline-flex items-center justify-center w-6 h-6 rounded text-white text-[10px] font-bold"
                    :class="{
                      'bg-green-500': result.item.metacritic >= 75,
                      'bg-yellow-500':
                        result.item.metacritic < 75 &&
                        result.item.metacritic >= 50,
                      'bg-red-500': result.item.metacritic < 50,
                    }"
                  >
                    {{ getMetacritic(result.item) }}
                  </span>

                  <!-- Рейтинги фильмов -->
                  <template v-if="mediaType === 'movie'">
                    <span
                      v-if="
                        'ratingKinopoisk' in result.item &&
                        result.item.ratingKinopoisk
                      "
                      class="text-xs text-gray-400"
                    >
                      КП:
                      <span class="font-semibold text-gray-600">
                        {{ result.item.ratingKinopoisk }}
                      </span>
                    </span>
                    <span
                      v-if="
                        'ratingImdb' in result.item && result.item.ratingImdb
                      "
                      class="text-xs text-gray-400"
                    >
                      IMDb:
                      <span class="font-semibold text-gray-600">
                        {{ result.item.ratingImdb }}
                      </span>
                    </span>
                  </template>

                  <!-- Страницы для книг -->
                  <span
                    v-if="
                      mediaType === 'book' &&
                      'pageCount' in result.item &&
                      result.item.pageCount
                    "
                    class="text-xs text-gray-400"
                  >
                    {{ result.item.pageCount }} стр.
                  </span>
                </div>
              </div>

              <!-- Кнопка добавить / сменить статус -->
              <div class="shrink-0" @click.stop>
                <!-- Уже добавлено — кнопка со статусом -->
                <button
                  v-if="result.isAdded"
                  @click="(e) => toggleDropdown(result.id, e)"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 border-green-400 bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <component
                    :is="getIconComponent(getStatusIcon(result.currentStatus))"
                    :size="13"
                    class="shrink-0"
                  />
                  <span class="max-w-[80px] truncate">
                    {{ getStatusLabel(mediaType, result.currentStatus) }}
                  </span>
                  <ChevronDown
                    :size="11"
                    :class="[
                      'transition-transform duration-200 shrink-0',
                      activeDropdown === result.id ? 'rotate-180' : '',
                    ]"
                  />
                </button>

                <!-- Ещё не добавлено -->
                <button
                  v-else
                  @click="(e) => toggleDropdown(result.id, e)"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 border-gray-200 bg-white text-gray-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Добавить</span>
                  <ChevronDown
                    :size="11"
                    :class="[
                      'transition-transform duration-200 shrink-0',
                      activeDropdown === result.id ? 'rotate-180' : '',
                    ]"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Пустой результат поиска -->
        <div
          v-else-if="searchQuery.length >= 2"
          class="text-center py-10 text-gray-400 flex-1 text-sm"
        >
          Ничего не найдено
        </div>

        <!-- Ожидание ввода -->
        <div v-else class="text-center py-10 text-gray-400 flex-1 text-sm">
          Введите название для поиска
        </div>
      </div>
    </div>
  </Transition>

  <!--
    Дропдаун статуса через Teleport.

    Проблема без Teleport: дропдаун — потомок скролл-контейнера с overflow:auto.
    Браузер обрезает position:absolute потомков когда на предке стоит overflow
    отличный от visible, даже при высоком z-index. У последних элементов списка
    дропдаун не вылезает вниз — он встраивается в контейнер, вызывая скролл.

    Решение: Teleport переносит разметку прямо в <body>, за пределы всех
    overflow-контейнеров. Позиция задаётся через position:fixed + числовые
    координаты viewport из dropdownCoords, вычисленные при клике на кнопку.

    activeResult — computed, который находит нужный EnrichedSearchResult
    по activeDropdown ID. Нужен потому, что Teleport-блок находится вне v-for
    и не имеет доступа к переменной result текущей итерации.
  -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="activeDropdown !== null && activeResult !== undefined"
        class="fixed z-[9999]"
        :style="{
          top: dropdownCoords.top + 'px',
          right: dropdownCoords.right + 'px',
        }"
        @click.stop
      >
        <div
          class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-w-[164px] py-1"
        >
          <button
            v-for="status in availableStatuses"
            :key="status.value"
            @click="handleSelectWithStatus(activeResult, status.value)"
            :disabled="isCurrentStatus(activeResult, status.value)"
            class="w-full cursor-pointer px-4 py-2.5 text-left transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            :class="
              isCurrentStatus(activeResult, status.value)
                ? 'bg-green-50 text-green-700'
                : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            "
          >
            <span class="text-sm font-medium flex-1">{{ status.label }}</span>
            <Check
              v-if="isCurrentStatus(activeResult, status.value)"
              :size="13"
              class="text-green-600 shrink-0"
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/*
  Дропдаун появляется снизу вверх (translateY положительный → элемент начинает
  чуть ниже и поднимается в финальную позицию).
*/
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
