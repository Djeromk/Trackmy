<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from "vue";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
import { BookOpen, Film, Gamepad2 } from "lucide-vue-next";
import type { MediaType, MediaStatus, ExternalMovie, ExternalBook, ExternalGame } from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();

const isSearchModalOpen = ref(false);
const selectedMediaType = ref<MediaType>("other");
const notification = ref<{ message: string; type: "success" | "error" } | null>(null);

const SearchModal = defineAsyncComponent({
  loader: () => import("@/components/search/SearchModal.vue"),
});
const MediaAccordion = defineAsyncComponent({
  loader: () => import("@/components/accordion/MediaAccordion.vue"),
});

onMounted(() => {
  if (authStore.user) {
    mediaStore.fetchUserMedia();
  }
});

const scrollPosition = ref(0);

function openSearchModal(type: MediaType) {
  scrollPosition.value = window.scrollY || document.documentElement.scrollTop;
  selectedMediaType.value = type;
  isSearchModalOpen.value = true;
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.top = `-${scrollPosition.value}px`;
}

function closeSearchModal() {
  isSearchModalOpen.value = false;
  document.body.style.overflow = "auto";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.top = "";
  window.scrollTo(0, scrollPosition.value);
}

async function handleMediaSelect(
  item: ExternalMovie | ExternalBook | ExternalGame,
  status: MediaStatus
) {
  if (!authStore.isAuthenticated) {
    showNotification("Войдите в аккаунт, чтобы сохранять медиа", "error");
    return;
  }

  const result = await mediaStore.addMediaFromExternal(item, selectedMediaType.value, status);

  showNotification(
    result.success
      ? result.message || "Медиа успешно добавлено!"
      : result.error || "Ошибка при добавлении медиа",
    result.success ? "success" : "error"
  );
}

async function handleStatusUpdate(id: string, status: MediaStatus) {
  const updates = {
    status,
    is_finished: status === "completed",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const result = await mediaStore.updateMedia(id, updates);

  showNotification(
    result.success
      ? "Статус успешно обновлён!"
      : result.error || "Ошибка при обновлении статуса",
    result.success ? "success" : "error"
  );
}

async function handleDeleteItem(id: string) {
  const result = await mediaStore.deleteMedia(id);
  showNotification(
    result.success
      ? "Элемент удалён из списка"
      : result.error || "Ошибка при удалении",
    result.success ? "success" : "error"
  );
}

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => (notification.value = null), 3000);
}

const addButtons = [
  { type: "book" as MediaType, label: "Книга", icon: BookOpen },
  { type: "movie" as MediaType, label: "Фильм", icon: Film },
  { type: "game" as MediaType, label: "Игра", icon: Gamepad2 },
];
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">
    <div class="container-xl px-6 py-8">
      <!-- Notification -->
      <Transition name="slide-down">
        <div
          v-if="notification"
          :class="[
            'fixed top-20 right-4 z-50 card-padded px-6 py-4 max-w-md',
            notification.type === 'success'
              ? 'border-l-4 border-green-500'
              : 'border-l-4 border-red-500',
          ]"
        >
          <p
            :class="
              notification.type === 'success'
                ? 'text-green-700'
                : 'text-red-700'
            "
          >
            {{ notification.message }}
          </p>
        </div>
      </Transition>

      <!-- Media Accordion -->
      <MediaAccordion
        v-if="authStore.user && mediaStore.userMedia.length > 0"
        :user-media="mediaStore.userMedia"
        @update-status="handleStatusUpdate"
        @delete-item="handleDeleteItem"
      />

      <!-- Empty state -->
      <div
        v-else-if="authStore.user"
        class="card-padded text-center py-16"
      >
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-(--gray-100) flex items-center justify-center"
        >
          <BookOpen :size="28" class="text-(--text-disabled)" />
        </div>
        <h3 class="text-lg font-semibold text-(--text-primary) mb-2">
          Библиотека пуста
        </h3>
        <p class="text-sm text-(--text-tertiary) mb-6">
          Добавьте первый элемент, чтобы начать отслеживать прогресс
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            v-for="btn in addButtons"
            :key="btn.type"
            @click="openSearchModal(btn.type)"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-(--primary) text-(--text-inverse) hover:opacity-90 transition-opacity cursor-pointer"
          >
            <component :is="btn.icon" :size="16" />
            {{ btn.label }}
          </button>
        </div>
      </div>

      <!-- Search Modal -->
      <SearchModal
        v-if="isSearchModalOpen"
        :media-type="selectedMediaType"
        @close="closeSearchModal"
        @select="handleMediaSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
