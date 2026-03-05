<script setup lang="ts">
import { ref, computed } from "vue";
import type { MediaStatus, UserMedia, MediaType } from "@/types";
import { getAvailableStatuses } from "@/components/search/utils";
import { Plus, ChevronDown, Check } from "lucide-vue-next";

interface Props {
  userMediaEntry: UserMedia | null;
  currentStatus: MediaStatus | null;
  mediaType: MediaType;
}

interface Emits {
  (e: "add", status: MediaStatus): void;
  (e: "update", status: MediaStatus): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const statusDropdownOpen = ref(false);

const availableStatuses = computed(() => getAvailableStatuses(props.mediaType));

function handleStatusClick(status: MediaStatus) {
  if (props.userMediaEntry) {
    emit("update", status);
  } else {
    emit("add", status);
  }
  statusDropdownOpen.value = false;
}
</script>

<template>
  <div class="relative bg-(--primary-500) w-full rounded-2xl">
    <button
      @click="statusDropdownOpen = !statusDropdownOpen"
      class="w-full flex items-center justify-between px-4 py-3 rounded-2xl  cursor-pointer transition-all hover:bg-(--primary-600) "
      :class="{
        'border-2 border-green-500 bg-green-500 text-black hover:bg-green-600': currentStatus !== null,
      }"
    >
      <span
        class="text-base font-medium text-white flex items-center gap-2"

      >
        <span v-if="currentStatus">
          {{ availableStatuses.find((s) => s.value === currentStatus)?.label }}
        </span>
        <span v-else class="flex items-center gap-1">
          <Plus :size="18" />
          Добавить в список
        </span>
      </span>
      <ChevronDown
        :size="18"
        :class="[
          'text-white transition-transform duration-200',
          statusDropdownOpen ? 'rotate-180' : '',
        ]"
      />
    </button>
    <div
      v-if="statusDropdownOpen"
      class="absolute bg-grey-200 left-0 right-0 top-full mt-2 z-10 rounded-xl overflow-hidden"
      style="background-color: #d1d5db;"
    >
      <button
        v-for="status in availableStatuses"
        :key="status.value"
        @click="handleStatusClick(status.value)"
        class="select-btn w-full px-4 py-3 text-left text-base text-(--text-primary) cursor-pointer flex items-center justify-between"
        :class="{
          'bg-green-50 text-black': currentStatus === status.value,
        }"
        style=""
      >
        <span>{{ status.label }}</span>
        <Check
          v-if="currentStatus === status.value"
          :size="18"
          class="text-green-600"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.select-btn {
  background-color: #d1d5db;
}
.select-btn:hover {
  background-color:  #6b7280;
  color: white
}
</style>
