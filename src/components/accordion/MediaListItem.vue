<script setup lang="ts">
import { ref, computed } from "vue";
import { Trash2 } from "lucide-vue-next";
import type { MediaStatus, UserMedia } from "@/types";
import { MEDIA_TYPE_LABELS } from "@/types";
import StatusDropdown from "@/components/common/StatusDropdown.vue";
import fallbackImage from "@/assets/fallback.svg";
import { getAvailableStatuses } from "../search/utils";

interface Props {
  item: UserMedia;
  currentStatus: MediaStatus;
}

interface Emits {
  (e: "update-status", id: string, status: MediaStatus): void;
  (e: "delete-item", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDeleteModalOpen = ref(false);

const availableStatuses = computed(() => getAvailableStatuses(props.item.media?.type));
const coverUrl = computed(() => {
  return (
    props.item.media?.coverUrl ||
    props.item.media?.cover_url ||
    fallbackImage
  );
});

const mediaTitle = computed(() =>
  props.item.media?.title || "Без названия"
);

const mediaTypeLabel = computed(() => {
  const type = props.item.media?.type;
  return type ? MEDIA_TYPE_LABELS[type] : "Неизвестно";
});

const mediaType = computed(() => props.item.media?.type);

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = fallbackImage;
}

function handleStatusChange(newStatus: MediaStatus) {
  emit("update-status", props.item.id, newStatus);
}

function confirmDelete() {
  emit("delete-item", props.item.id);
  isDeleteModalOpen.value = false;
}
</script>

<template>
  <div class="relative group">
    <div
      class="flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-(--background-hover)"
    >
      <router-link
        :to="`/${mediaType}s/${item.media?.external_id}`"
        class="shrink-0"
      >
        <div
          class="w-10 h-14 rounded-lg overflow-hidden bg-(--gray-100) shadow-(--shadow-xs) ring-1 ring-black/5 transition-transform duration-200 hover:scale-105"
        >
          <img
            :src="coverUrl"
            :alt="mediaTitle"
            loading="lazy"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>
      </router-link>
      <div class="flex-1 min-w-0">
        <router-link :to="`/${mediaType}s/${item.media?.external_id}`">
          <h4
            class="text-xs md:text-sm font-semibold text-(--text-primary) truncate leading-snug mb-0.5 hover:text-(--primary-600) transition-colors"
          >
            {{ mediaTitle }}
          </h4>
        </router-link>

        <p class="text-xs text-(--text-tertiary)">
          {{ mediaTypeLabel }}
        </p>
        <div v-if="item.rating" class="flex items-center gap-1 mt-1.5">
          <span class="text-amber-400 text-xs">★</span>
          <span class="text-xs font-medium text-(--text-secondary)">
            {{ item.rating }}/5
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <div class="w-32">
          <StatusDropdown
            :current-status="currentStatus"
            :available-statuses="availableStatuses"
            :compact="true"
            @select="handleStatusChange"
          />
        </div>
        <button
          @click="isDeleteModalOpen = true"
          class="p-1.5 rounded-lg text-(--text-tertiary) hover:text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100"
          title="Удалить из списка"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

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
          <div
            class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center"
          >
            <Trash2 :size="22" class="text-red-500" />
          </div>

          <h3
            class="text-base font-semibold text-(--text-primary) text-center mb-1"
          >
            Удалить из списка?
          </h3>

          <p class="text-sm text-(--text-tertiary) text-center mb-6">
            «{{ mediaTitle }}» будет удалён. Это действие нельзя отменить.
          </p>
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

@media (max-width: 640px) {
  .px-5.py-4 {
    padding: 0.75rem 1rem;
  }

  .w-10.h-14 {
    width: 2rem;
    height: 3rem;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
