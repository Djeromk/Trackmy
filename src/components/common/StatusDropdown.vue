<script setup lang="ts">
/**
 * StatusDropdown — универсальный компонент выбора статуса медиа.
 *
 * АДАПТИВНОСТЬ:
 * - Мобильные (< 640px): нативный <select> для лучшего UX
 * - Десктоп (>= 640px): кастомный dropdown с позиционированием
 *
 * ПОЗИЦИОНИРОВАНИЕ DROPDOWN:
 * - Вычисляет координаты кнопки через getBoundingClientRect()
 * - Использует Teleport для рендера вне overflow-контейнеров
 * - Автоматически определяет направление открытия (вверх/вниз)
 *
 * ИСПОЛЬЗОВАНИЕ:
 * <StatusDropdown
 *   :current-status="status"
 *   :available-statuses="statuses"
 *   @select="handleSelect"
 * />
 */

import { ref, computed } from "vue";
import { ChevronDown, Check } from "lucide-vue-next";
import type { MediaStatus } from "@/types";

export interface StatusOption {
  value: MediaStatus;
  label: string;
}

interface Props {
  currentStatus: MediaStatus | null;
  availableStatuses: StatusOption[];
  placeholderText?: string;
  compact?: boolean;
  buttonClass?: string;
}

interface Emits {
  (e: "select", status: MediaStatus): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholderText: "Добавить в список",
  compact: false,
  buttonClass: "",
});

const emit = defineEmits<Emits>();
const isOpen = ref(false);
interface DropdownCoords {
  top: number;
  right: number;
}

const dropdownCoords = ref<DropdownCoords>({ top: 0, right: 0 });
const buttonRef = ref<HTMLButtonElement | null>(null);

const buttonLabel = computed(() => {
  if (!props.currentStatus) return props.placeholderText;

  const option = props.availableStatuses.find(
    (s) => s.value === props.currentStatus,
  );
  return option?.label ?? props.currentStatus;
});

const buttonClasses = computed(() => {
  const base = props.compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-3 text-sm";

  const status =
    props.currentStatus !== null
      ? "bg-(--primary-50) border-(--primary-300) text-(--primary-700) hover:bg-(--primary-100)"
      : "bg-white border-(--border-color) text-(--text-secondary) hover:border-(--primary-300) hover:bg-(--background-hover)";

  return `${base} ${status} ${props.buttonClass}`;
});

function toggleDropdown() {
  if (!buttonRef.value) return;

  if (isOpen.value) {
    isOpen.value = false;
    return;
  }

  const rect = buttonRef.value.getBoundingClientRect();
  const estimatedDropdownHeight = props.availableStatuses.length * 44 + 8;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < estimatedDropdownHeight;

  dropdownCoords.value = {
    top: openUpward ? rect.top - estimatedDropdownHeight - 6 : rect.bottom + 6,
    right: window.innerWidth - rect.right,
  };

  isOpen.value = true;
}

function handleSelect(status: MediaStatus) {
  emit("select", status);
  isOpen.value = false;
}

function handleNativeSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const status = target.value as MediaStatus;

  if (status) {
    emit("select", status);
  }
  target.value = "";
}

function isCurrentStatus(status: MediaStatus): boolean {
  return props.currentStatus === status;
}
</script>

<template>
  <div class="status-dropdown-desktop">
    <button
      ref="buttonRef"
      type="button"
      @click="toggleDropdown"
      class="w-full flex items-center justify-between rounded-xl transition-all duration-200 font-medium cursor-pointer"
      :class="buttonClasses"
    >
      <span>{{ buttonLabel }}</span>
      <ChevronDown
        :size="compact ? 14 : 16"
        :class="[
          'transition-transform duration-200 shrink-0',
          isOpen ? 'rotate-180' : '',
        ]"
      />
    </button>
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          class="fixed z-9999"
          :style="{
            top: dropdownCoords.top + 'px',
            right: dropdownCoords.right + 'px',
          }"
          @click.stop
        >
          <div
            class="bg-(--background-elevated) rounded-xl shadow-2xl border-(--border-color) overflow-hidden min-w-[164px] py-1"
          >
            <button
              v-for="option in availableStatuses"
              :key="option.value"
              type="button"
              @click="handleSelect(option.value)"
              :disabled="isCurrentStatus(option.value)"
              class="w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between disabled:cursor-not-allowed"
              :class="
                isCurrentStatus(option.value)
                  ? 'bg-(--primary-50) text-(--primary-700)'
                  : 'text-(--text-secondary) hover:bg-(--background-hover) active:bg-(--gray-100) cursor-pointer'
              "
            >
              <span class="text-sm font-medium">{{ option.label }}</span>
              <Check
                v-if="isCurrentStatus(option.value)"
                :size="13"
                class="text-(--primary-600) shrink-0"
              />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <div class="status-dropdown-mobile">
    <div class="relative inline-flex items-center">
      <div
        class="flex items-center justify-center rounded-xl bg-white border border-transparent transition-all"
        :class="compact ? 'p-1.5' : 'p-3'"
        :style="{
          backgroundColor:
            currentStatus !== null ? 'var(--primary-50)' : 'white',
          color:
            currentStatus !== null
              ? 'var(--primary-700)'
              : 'var(--text-tertiary)',
        }"
      >
        <ChevronDown :size="compact ? 14 : 16" />
      </div>
      <select
        @change="handleNativeSelectChange"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
      >
        <option
          v-for="option in availableStatuses"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.status-dropdown-desktop {
  display: none;
}

.status-dropdown-mobile {
  display: block;
}

/* Десктоп >= 768px */
@media (min-width: 768px) {
  .status-dropdown-desktop {
    display: block;
  }

  .status-dropdown-mobile {
    display: none;
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.status-dropdown-mobile select:hover {
  border-color: var(--primary-300);
}

.status-dropdown-mobile select:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 20%, transparent);
}
</style>
