<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  MediaType,
  MediaStatus,
  ExternalBook,
  ExternalGame,
  ExternalMovie,
} from "@/types";
import * as utils from "./utils";
import { kinopoiskService } from "@/services/api/kinopoisk";
import { booksService } from "@/services/api/google-books";
import { gamesService } from "@/services/api/games";
import { useMediaStore } from "@/stores/media";
import { MEDIA_TYPE_LABELS } from "@/types";
import fallbackImage from "@/assets/fallback.svg";
import StatusDropdown from "@/components/common/StatusDropdown.vue";

import { X } from "lucide-vue-next";

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

interface EnrichedSearchResult {
  item: ExternalMovie | ExternalBook | ExternalGame;
  id: string;
  isAdded: boolean;
  currentStatus: MediaStatus | null;
  userMediaId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref("");
const mediaStore = useMediaStore();
const searchResults = ref<(ExternalMovie | ExternalBook | ExternalGame)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const itemRef = ref<HTMLElement[]>([]);
const activeIndex = ref(-1);

const inputRef = ref<HTMLInputElement | null>(null);

function moveFocus(delta: number) {
  const total = enrichedResults.value.length;
  if (total === 0) return;

  const next = activeIndex.value + delta;
  if (next < 0) {
    activeIndex.value = -1;
    inputRef.value?.focus();
    return;
  }
  if (next >= total) return;

  activeIndex.value = next;
  itemRef.value[next]?.focus();
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const enrichedResults = computed<EnrichedSearchResult[]>(() => {
  return searchResults.value.map((item) => {
    const itemId = utils.getItemId(item);
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

watch(enrichedResults, () => {
  activeIndex.value = -1;
});

const availableStatuses = computed(() => utils.getAvailableStatuses(props.mediaType));
const placeholder = computed(() => utils.getSearchPlaceholder(props.mediaType));

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

function handleClose() {
  searchQuery.value = "";
  searchResults.value = [];
  emit("close");
}

const handleImageError = utils.createImageErrorHandler(fallbackImage);

function handleSelectWithStatus(
  result: EnrichedSearchResult,
  status: MediaStatus,
) {
  if (result.isAdded && result.currentStatus === status) {
    return;
  }

  if (result.isAdded && result.userMediaId) {
    mediaStore.updateMedia(result.userMediaId, {
      status,
      is_finished: status === "completed",
      completed_at: status === "completed" ? new Date().toISOString() : null,
    });
    return;
  }
  emit("select", result.item, status);
}

const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
  },
};
</script>

<template>
  <Transition name="fade">
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
      @click.self="handleClose"
      @keydown.esc="handleClose"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        @click="handleClose"
      >
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

        <div class="px-6 py-3 shrink-0">
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="placeholder"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all text-base"
            autofocus
            v-focus
            @click.stop
            @keydown.down.prevent="moveFocus(1)"
          />
        </div>

        <div v-if="loading" class="flex justify-center py-10 flex-1">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
          />
        </div>

        <div v-else-if="error" class="text-center py-10 flex-1 px-6">
          <p class="text-base text-red-500">{{ error }}</p>
        </div>

        <div
          v-else-if="enrichedResults.length > 0"
          class="overflow-y-auto flex-1 px-4 pb-3"
        >
          <ul class="space-y-0.5 pt-1">
            <li
              v-for="result in enrichedResults"
              :key="result.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                class="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm"
              >
                <img
                  v-if="utils.getImage(result.item)"
                  :src="utils.getImage(result.item)!"
                  :alt="utils.getTitle(result.item)"
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

              <div class="flex-1 min-w-0">
                <router-link :to="`/${mediaType}s/${result.item.id}`">
                  <h3
                    class="font-semibold text-sm text-gray-900 truncate hover:text-primary-600 transition-colors leading-snug"
                  >
                    {{ utils.getTitle(result.item) }}
                  </h3>
                </router-link>

                <p class="text-xs text-gray-500 mt-0.5 truncate leading-tight">
                  {{ utils.getSubtitle(result.item) }}
                </p>

                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-xs text-gray-400">
                    {{ utils.getReleaseDate(result.item) }}
                  </span>

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
                    {{ utils.getMetacritic(result.item) }}
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
              <div class="shrink-0" @click.stop>
                <StatusDropdown
                  :current-status="result.currentStatus"
                  :available-statuses="availableStatuses"
                  :placeholder-text="result.isAdded ? undefined : 'Добавить'"
                  :compact="true"
                  :button-class="
                    result.isAdded
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : ''
                  "
                  @select="(status) => handleSelectWithStatus(result, status)"
                />
              </div>
            </li>
          </ul>
        </div>

        <div
          v-else-if="searchQuery.length >= 2"
          class="text-center py-10 text-gray-400 flex-1 text-base"
        >
          Ничего не найдено
        </div>

        <div v-else class="text-center py-10 text-gray-400 flex-1 text-base">
          Введите название для поиска
        </div>
      </div>
    </div>
  </Transition>
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
</style>
