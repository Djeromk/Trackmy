<script setup lang="ts">
import { Star } from "lucide-vue-next";
import type { UserMedia } from "@/types";
import { useMediaStore } from "@/stores/media";

interface Props {
  userMediaEntry: UserMedia;
}

const props = defineProps<Props>();
const mediaStore = useMediaStore();

function handleRatingClick(rating: number) {
  mediaStore.updateMedia(props.userMediaEntry.id, { rating });
}
</script>

<template>
  <div class="w-full card-neo shadow-neo p-4">
    <p class="text-sm text-(--text-primary) mb-2 font-medium">Ваш рейтинг</p>
    <div class="flex gap-1">
      <button
        v-for="star in 5"
        :key="star"
        @click="handleRatingClick(star)"
        class="cursor-pointer transition-transform hover:scale-110"
      >
        <Star
          :size="28"
          :class="
            star <= (userMediaEntry.rating ?? 0)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          "
        />
      </button>
    </div>
  </div>
</template>
