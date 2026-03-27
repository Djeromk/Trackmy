<!-- src/components/featured/FeaturedCard.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Check } from "lucide-vue-next";
import type { FeaturedItemEnriched } from "@/types/featured";
import type { MediaStatus } from "@/types";
import { getAvailableStatuses } from "@/components/search/utils";
import { createImageErrorHandler } from "@/components/search/utils";
import fallbackImage from "@/assets/fallback.svg";

interface Props {
  item: FeaturedItemEnriched;
  /** false для неавторизованных и анонимных — кнопка "+" не показывается */
  canAdd: boolean;
}

interface Emits {
  (e: "add", status: MediaStatus): void;
  (e: "update", status: MediaStatus): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDropdownOpen = ref(false);
const dropdownCoords = ref({ top: 0, left: 0 });
const btnRef = ref<HTMLButtonElement | null>(null);

const availableStatuses = computed(() => getAvailableStatuses(props.item.type));

const mediaRoute = computed(
  () => `/${props.item.type}s/${props.item.external_id}`,
);

const handleImageError = createImageErrorHandler(fallbackImage);

function openDropdown() {
  if (!btnRef.value) return;

  const rect = btnRef.value.getBoundingClientRect();
  const estimatedHeight = availableStatuses.value.length * 44 + 8;
  const dropdownWidth = 160;

  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < estimatedHeight;

  const rawLeft = rect.left;
  const maxLeft = window.innerWidth - dropdownWidth - 8;
  const left = Math.min(rawLeft, maxLeft);

  dropdownCoords.value = {
    top: openUpward ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
    left,
  };

  isDropdownOpen.value = true;
}

function toggleDropdown(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  if (isDropdownOpen.value) {
    isDropdownOpen.value = false;
  } else {
    openDropdown();
  }
}

function handleStatusClick(status: MediaStatus) {
  if (props.item.isAdded) {
    emit("update", status);
  } else {
    emit("add", status);
  }
  isDropdownOpen.value = false;
}
</script>

<template>
  <article class="featured-card">
    <div class="featured-card__cover-wrap">
      <router-link :to="mediaRoute" class="featured-card__cover-link">
        <div class="featured-card__cover">
          <img
            v-if="item.cover_url"
            :src="item.cover_url"
            :alt="item.title"
            loading="lazy"
            class="featured-card__img"
            @error="handleImageError"
          />
          <div v-else class="featured-card__cover-fallback">📄</div>
        </div>
      </router-link>

      <div v-if="canAdd" class="featured-card__btn-wrap">
        <button
          ref="btnRef"
          type="button"
          class="featured-card__btn"
          :class="
            item.isAdded
              ? 'featured-card__btn--added'
              : 'featured-card__btn--default'
          "
          :title="item.isAdded ? 'Изменить статус' : 'Добавить в список'"
          @click="toggleDropdown"
        >
          <Check v-if="item.isAdded" :size="13" />
          <Plus v-else :size="13" />
        </button>
      </div>
    </div>

    <!-- ── Название ──────────────────────────────────────────── -->
    <div class="featured-card__body">
      <router-link :to="mediaRoute" class="featured-card__title-link">
        <p class="featured-card__title">{{ item.title }}</p>
      </router-link>
    </div>
    <Teleport to="body">
      <div
        v-if="isDropdownOpen"
        class="featured-overlay"
        @click="isDropdownOpen = false"
      />

      <Transition name="featured-dropdown">
        <div
          v-if="isDropdownOpen"
          class="featured-dropdown"
          :style="{
            top: dropdownCoords.top + 'px',
            left: dropdownCoords.left + 'px',
          }"
          @click.stop
        >
          <button
            v-for="status in availableStatuses"
            :key="status.value"
            type="button"
            class="featured-dropdown__item"
            :class="
              item.currentStatus === status.value &&
              'featured-dropdown__item--active'
            "
            @click="handleStatusClick(status.value)"
          >
            <span>{{ status.label }}</span>
            <Check
              v-if="item.currentStatus === status.value"
              :size="12"
              class="featured-dropdown__check"
            />
          </button>
        </div>
      </Transition>
    </Teleport>
  </article>
</template>

<style scoped>
/* ── Карточка ─────────────────────────────────────────────────── */
.featured-card {
  /*
    Резиновая карточка через fluid-width:
    - min-width: никогда не сужается меньше 130px
    - max-width: не растёт больше 200px на больших экранах
    - width: заполняет доступное пространство
    - flex-shrink: 0 — карусель не сжимает карточки
  */
  min-width: 130px;
  max-width: 200px;
  width: clamp(130px, 18vw, 200px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ── Обёртка обложки — якорь для кнопки ───────────────────────── */
.featured-card__cover-wrap {
  position: relative;
}

.featured-card__cover-link {
  display: block;
  text-decoration: none;
}

.featured-card__cover {
  width: 100%;
  /*
    aspect-ratio 2/3 — стандартное соотношение постера.
    Высота адаптируется под текущую ширину карточки автоматически.
  */
  aspect-ratio: 2 / 3;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background-color: var(--gray-100);
  border: 1px solid var(--border-color);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.featured-card__cover-link:hover .featured-card__cover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.featured-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.featured-card__cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-disabled);
}

/* ── Кнопка в верхнем левом углу обложки ─────────────────────── */
.featured-card__btn-wrap {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  z-index: 1;
}

.featured-card__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow: var(--shadow-sm);
}

.featured-card__btn--default {
  background-color: rgba(255, 255, 255, 0.88);
  color: var(--primary-700);
}

.featured-card__btn--default:hover {
  background-color: var(--primary-500);
  color: white;
  transform: scale(1.08);
}

.featured-card__btn--added {
  background-color: rgba(255, 255, 255, 0.88);
  color: var(--status-completed-text);
}

.featured-card__btn--added:hover {
  background-color: rgba(255, 255, 255, 0.98);
  transform: scale(1.05);
}

/* ── Название ─────────────────────────────────────────────────── */
.featured-card__body {
  flex: 1;
}

.featured-card__title-link {
  text-decoration: none;
}

.featured-card__title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  line-height: var(--leading-snug);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
  margin: 0;
}

.featured-card__title-link:hover .featured-card__title {
  color: var(--primary-500);
}
</style>

<!--
  Глобальные стили для Teleport-элементов.
  scoped не работает для узлов вне компонентного дерева —
  Teleport перемещает DOM в <body>, где data-v-атрибут не применяется.
-->
<style>
.featured-overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-dropdown) - 1);
  background: transparent;
}

.featured-dropdown {
  position: fixed;
  z-index: var(--z-dropdown);
  min-width: 160px;
  background-color: var(--background-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  padding: 0.25rem 0;
}

.featured-dropdown__item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
  font-family: var(--font-sans);
  white-space: nowrap;
}

.featured-dropdown__item:hover {
  background-color: var(--background-hover);
  color: var(--text-primary);
}

.featured-dropdown__item--active {
  background-color: var(--primary-50);
  color: var(--primary-700);
}

.featured-dropdown__check {
  color: var(--primary-600);
  flex-shrink: 0;
}

.featured-dropdown-enter-active,
.featured-dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.featured-dropdown-enter-from,
.featured-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
</style>
