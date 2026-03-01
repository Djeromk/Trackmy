<script setup lang="ts">
import { ref, computed } from "vue";
import type { MediaType, MediaStatus, UserMedia } from "@/types";
import { MEDIA_TYPE_LABELS } from "@/types";
import AccordionSection from "./AccordionSection.vue";
import { BookOpen, Film, Gamepad2, LayoutList } from "lucide-vue-next";

interface Props {
  userMedia: UserMedia[];
}

interface Emits {
  (e: "update-status", id: string, status: MediaStatus): void;
  (e: "delete-item", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedFilter = ref<MediaType | "all">("all");

const filters: {
  value: MediaType | "all";
  label: string;
  icon: typeof BookOpen;
}[] = [
  { value: "all", label: "Все", icon: LayoutList },
  { value: "movie", label: MEDIA_TYPE_LABELS.movie, icon: Film },
  { value: "book", label: MEDIA_TYPE_LABELS.book, icon: BookOpen },
  { value: "game", label: MEDIA_TYPE_LABELS.game, icon: Gamepad2 },
];

/**
 * Количество видимых элементов с учётом активного фильтра.
 * Используется в шапке и для показа пустого состояния.
 */
const visibleCount = computed(() => {
  if (selectedFilter.value === "all") return props.userMedia.length;
  return props.userMedia.filter(
    (item) => item.media?.type === selectedFilter.value,
  ).length;
});

/**
 * Счётчики для бейджей в табах.
 * Считаем по полному userMedia — не зависит от активного фильтра.
 */
const countByFilter = computed(() => {
  const counts: Record<MediaType | "all", number> = {
    all: props.userMedia.length,
    movie: 0,
    book: 0,
    game: 0,
    other: 0,
  };
  props.userMedia.forEach((item) => {
    if (item.media?.type) counts[item.media.type]++;
  });
  return counts;
});

/**
 * Группировка ВСЕГО userMedia по статусам — без учёта фильтра.
 *
 * Намеренно НЕ фильтруем здесь по типу медиа.
 * Фильтр передаётся в AccordionSection как `activeFilter` и
 * применяется через v-show на каждом MediaListItem.
 *
 * Это позволяет сохранять DOM-узлы <img> при смене таба,
 * предотвращая повторную загрузку обложек.
 */
const groupedByStatus = computed(() => {
  const groups: Record<MediaStatus, UserMedia[]> = {
    backlog: [],
    in_progress: [],
    completed: [],
    dropped: [],
  };
  props.userMedia.forEach((item) => {
    if (item.status && groups[item.status]) {
      groups[item.status].push(item);
    }
  });
  return groups;
});

/**
 * Количество видимых элементов в конкретной группе с учётом фильтра.
 * Нужно для бейджа в заголовке AccordionSection.
 */
function visibleCountInGroup(items: UserMedia[]): number {
  if (selectedFilter.value === "all") return items.length;
  return items.filter((item) => item.media?.type === selectedFilter.value)
    .length;
}
</script>

<template>
  <div class="w-full space-y-6" id="my-lists">
    <!-- Шапка с заголовком и счётчиком -->
    <div class="flex items-end justify-between">
      <div>
        <h2 class="mb-1">Мои списки</h2>
        <p class="text-sm text-(--text-tertiary)">
          {{ visibleCount }} {{ visibleCount === 1 ? "элемент" : "элементов" }}
        </p>
      </div>
    </div>

    <!-- Таб-переключатель фильтра по типу медиа -->
    <div
      class="flex items-center gap-1 p-1 rounded-xl bg-(--gray-100) md:w-fit overflow-x-auto scrollbar-hide-true"
    >
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="selectedFilter = filter.value"
        class="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
        :class="
          selectedFilter === filter.value
            ? 'bg-(--primary-400) text-(--text-primary) shadow-(--shadow-sm)'
            : 'text-(--text-tertiary) hover:text-(--text-secondary)'
        "
      >
        <component :is="filter.icon" :size="15" />
        <span>{{ filter.label }}</span>
        <span
          v-if="countByFilter[filter.value] > 0"
          class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          :class="
            selectedFilter === filter.value
              ? 'bg-(--primary-100) text-(--primary-700)'
              : 'bg-(--gray-200) text-(--gray-500)'
          "
        >
          {{ countByFilter[filter.value] }}
        </span>
      </button>
    </div>

    <!-- Секции аккордеона.
         Передаём ВСЕ items каждого статуса + activeFilter.
         Внутри AccordionSection элементы скрываются через v-show,
         а не пересоздаются — обложки не перезагружаются. -->
    <div class="space-y-3">
      <AccordionSection
        title="В процессе"
        :items="groupedByStatus.in_progress"
        :visible-count="visibleCountInGroup(groupedByStatus.in_progress)"
        :active-filter="selectedFilter"
        status="in_progress"
        @update-status="(id, s) => emit('update-status', id, s)"
        @delete-item="(id) => emit('delete-item', id)"
      />
      <AccordionSection
        title="Бэклог"
        :items="groupedByStatus.backlog"
        :visible-count="visibleCountInGroup(groupedByStatus.backlog)"
        :active-filter="selectedFilter"
        status="backlog"
        @update-status="(id, s) => emit('update-status', id, s)"
        @delete-item="(id) => emit('delete-item', id)"
      />
      <AccordionSection
        title="Завершённые"
        :items="groupedByStatus.completed"
        :visible-count="visibleCountInGroup(groupedByStatus.completed)"
        :active-filter="selectedFilter"
        status="completed"
        @update-status="(id, s) => emit('update-status', id, s)"
        @delete-item="(id) => emit('delete-item', id)"
      />
      <AccordionSection
        title="Брошенные"
        :items="groupedByStatus.dropped"
        :visible-count="visibleCountInGroup(groupedByStatus.dropped)"
        :active-filter="selectedFilter"
        status="dropped"
        @update-status="(id, s) => emit('update-status', id, s)"
        @delete-item="(id) => emit('delete-item', id)"
      />
    </div>

    <!-- Пустое состояние -->
    <div v-if="visibleCount === 0" class="card-padded text-center py-14">
      <div
        class="w-14 h-14 mx-auto mb-4 rounded-full bg-(--gray-100) flex items-center justify-center"
      >
        <component
          :is="
            filters.find((f) => f.value === selectedFilter)?.icon ?? LayoutList
          "
          :size="24"
          class="text-(--gray-300)"
        />
      </div>
      <p class="text-sm font-medium text-(--text-primary) mb-1">
        {{
          selectedFilter === "all"
            ? "Ваш список пуст"
            : `Нет ${filters.find((f) => f.value === selectedFilter)?.label.toLowerCase()}`
        }}
      </p>
      <p class="text-xs text-(--text-tertiary)">
        Добавляйте медиа через кнопку «Добавить» в карточках категорий
      </p>
    </div>
  </div>
</template>
<style>
@media (max-width: 640px) {
  /* Контейнер фильтра должен скроллиться горизонтально */
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }

  /* Уменьшить иконки в кнопках фильтра */
  button svg {
    width: 14px;
    height: 14px;
  }

  /* Уменьшить бейджи с цифрами */
  button span[class*="rounded-full"] {
    min-width: 16px;
    height: 16px;
    font-size: 9px;
    padding: 0 4px;
  }
}
</style>
