import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { db } from "@/services/supabase";
import { mediaService } from "@/services/mediaService";
import { subscribeToUserMedia } from "@/services/supabase";
import type { RealtimeUserMediaPayload } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  UserMedia,
  MediaType,
  MediaStatus,
  DashboardStats,
  ExternalGame,
  ExternalMovie,
  ExternalBook,
} from "@/types";
import { useAuthStore } from "./auth";
import type { PostgrestError } from "@supabase/supabase-js";

interface MediaResponse {
  success: boolean;
  error?: string;
  mediaId?: string;
  message?: string;
}

export const useMediaStore = defineStore("media", () => {
  const authStore = useAuthStore();
  const realtimeChannel = ref<RealtimeChannel | null>(null);
  const userMedia = ref<UserMedia[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Автоматически рассчитывает статистику на основе userMedia
  const stats = computed<DashboardStats>(() => {
    const calculateStats = (type: MediaType) => {
      const items = userMedia.value.filter((m) => m.media?.type === type);
      return {
        total: items.length,
        completed: items.filter((m) => m.status === "completed").length,
        inProgress: items.filter((m) => m.status === "in_progress").length,
        backlog: items.filter((m) => m.status === "backlog").length,
        dropped: items.filter((m) => m.status === "dropped").length,
      };
    };

    return {
      movies: calculateStats("movie"),
      books: calculateStats("book"),
      games: calculateStats("game"),
      overall: {
        totalItems: userMedia.value.length,
        completedItems: userMedia.value.filter((m) => m.status === "completed")
          .length,
      },
    };
  });
  async function applyRealtimeEvent(
    payload: RealtimeUserMediaPayload,
  ): Promise<void> {
    if (payload.eventType === "DELETE") {
      const deletedId = payload.old.id;
      if (!deletedId) return;
      const idx = userMedia.value.findIndex((m) => m.id === deletedId);
      if (idx !== -1) userMedia.value.splice(idx, 1);
      return;
    }

    if (payload.eventType === "UPDATE") {
      const updatedId = payload.new.id;
      if (!updatedId) return;
      const idx = userMedia.value.findIndex((m) => m.id === updatedId);
      if (idx === -1) return;
      // Мержим только пришедшие поля — media-данные берём из существующей записи.
      // Это сохраняет join (media?.title, media?.cover_url и т.д.)
      // который в realtime payload отсутствует.
      const existing = userMedia.value[idx];
      const updated: UserMedia = {
        ...existing,
        status: (payload.new.status as UserMedia["status"]) ?? existing.status,
        rating:
          payload.new.rating !== undefined
            ? payload.new.rating
            : existing.rating,
        review:
          payload.new.review !== undefined
            ? payload.new.review
            : existing.review,
        is_finished: payload.new.is_finished ?? existing.is_finished,
        started_at:
          payload.new.started_at !== undefined
            ? payload.new.started_at
            : existing.started_at,
        completed_at:
          payload.new.completed_at !== undefined
            ? payload.new.completed_at
            : existing.completed_at,
        current_page:
          payload.new.current_page !== undefined
            ? payload.new.current_page
            : existing.current_page,
        currentPage:
          payload.new.current_page !== undefined
            ? payload.new.current_page
            : existing.currentPage,
        current_season:
          payload.new.current_season !== undefined
            ? payload.new.current_season
            : existing.current_season,
        current_episode:
          payload.new.current_episode !== undefined
            ? payload.new.current_episode
            : existing.current_episode,
        watched_episodes:
          payload.new.watched_episodes ?? existing.watched_episodes,
        hoursPlayed:
          payload.new.hours_played !== undefined
            ? payload.new.hours_played
            : existing.hoursPlayed,
        updatedAt: payload.new.updated_at ?? existing.updatedAt,
      };
      userMedia.value.splice(idx, 1, updated);
    }
  }

  function stopRealtime(): void {
    if (realtimeChannel.value) {
      realtimeChannel.value.unsubscribe();
      realtimeChannel.value = null;
    }
  }

  function startRealtime(userId: string): void {
    stopRealtime();
    realtimeChannel.value = subscribeToUserMedia(userId, applyRealtimeEvent);
  }

  // Вспомогательные геттеры для фильтрации
  const getMediaByType = (type: MediaType) => {
    return userMedia.value.filter((m) => m.media?.type === type);
  };

  const getMediaByStatus = (status: MediaStatus) => {
    return userMedia.value.filter((m) => m.status === status);
  };

  async function fetchUserMedia() {
    if (!authStore.user) return;
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await db.getUserMedia(
        authStore.user.id,
      );
      if (fetchError) throw fetchError;
      userMedia.value = data as UserMedia[];
      startRealtime(authStore.user.id);
    } catch (e) {
      const dbError = e as PostgrestError;
      error.value = dbError.message;
    } finally {
      loading.value = false;
    }
  }

  async function addMediaFromExternal(
    item: ExternalMovie | ExternalBook | ExternalGame,
    type: MediaType,
    status: MediaStatus = "backlog",
  ): Promise<MediaResponse> {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaService.createMediaFromExternal({
        item,
        type,
        userId: authStore.user?.id || null,
        status,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to add media");
      }

      if (authStore.user) {
        await fetchUserMedia();
      }

      return {
        success: true,
        mediaId: result.mediaId,
        message: "Media added successfully",
      };
    } catch (e) {
      const err = e as Error;
      error.value = err.message;
      return {
        success: false,
        error: err.message,
        message: "Failed to add media",
      };
    } finally {
      loading.value = false;
    }
  }

  // Добавляет новый медиа элемент в список пользователя
  // async function addMedia(
  //   mediaId: string,
  //   status: MediaStatus
  // ): Promise<MediaResponse> {
  //   if (!authStore.user)
  //     return { success: false, error: "User not authenticated" };

  //   loading.value = true;
  //   error.value = null;
  //   try {
  //     const { error: addError } = await db.addUserMedia({
  //       userId: authStore.user.id,
  //       mediaId,
  //       status,
  //       current_season: 1,
  //       current_episode: 1,
  //     });

  //     if (addError) throw addError;

  //     // Перезагружаем данные чтобы получить обновленный список
  //     await fetchUserMedia();
  //     return { success: true };
  //   } catch (e) {
  //     const dbError = e as PostgrestError;
  //     error.value = dbError.message;
  //     return { success: false, error: dbError.message };
  //   } finally {
  //     loading.value = false;
  //   }
  // }

  // Обновляет существующий медиа элемент (рейтинг, статус, отзыв и т.д.)
  async function updateMedia(
    id: string,
    updates: Partial<UserMedia>,
  ): Promise<MediaResponse> {
    error.value = null;
    const itemIndex = userMedia.value.findIndex((item) => item.id === id);

    let previousState: UserMedia | null = null;
    if (itemIndex !== -1) {
      previousState = { ...userMedia.value[itemIndex] };

      const updatedItem: UserMedia = {
        ...userMedia.value[itemIndex],
        ...updates,
      };
      userMedia.value.splice(itemIndex, 1, updatedItem);
    }
    try {
      const { error: updateError } = await db.updateUserMedia(id, updates);
      if (updateError) throw updateError;

      return { success: true };
    } catch (e) {
      if (itemIndex !== -1 && previousState !== null) {
        userMedia.value.splice(itemIndex, 1, previousState);
      }
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    }
  }
  // async function updateMedia(
  //   id: string,
  //   updates: Partial<UserMedia>,
  // ): Promise<MediaResponse> {
  //   loading.value = true;
  //   error.value = null;
  //   console.log("updateMedia updates", id, updates.watched_episodes);
  //   try {
  //     const { error: updateError } = await db.updateUserMedia(id, updates);

  //     if (updateError) throw updateError;

  //     await fetchUserMedia();
  //     return { success: true };
  //   } catch (e) {
  //     const dbError = e as PostgrestError;
  //     error.value = dbError.message;
  //     return { success: false, error: dbError.message };
  //   } finally {
  //     loading.value = false;
  //   }
  // }

  async function deleteMedia(id: string): Promise<MediaResponse> {
    loading.value = true;
    error.value = null;
    try {
      const { error: deleteError } = await db.deleteUserMedia(id);

      if (deleteError) throw deleteError;

      await fetchUserMedia();
      return { success: true };
    } catch (e) {
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    } finally {
      loading.value = false;
    }
  }

  function clearUserMedia(): void {
    stopRealtime();
    userMedia.value = [];
    error.value = null;
  }

  const getInProgressByType = computed(() => {
    return (type: MediaType) => {
      const items = userMedia.value.filter(
        (m) => m.media?.type === type && m.status === "in_progress",
      );

      // Сортируем по дате обновления (или создания) - самый свежий первый
      return items.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // От новых к старым
      });
    };
  });

  return {
    userMedia,
    loading,
    error,
    stats,
    getMediaByType,
    getMediaByStatus,
    getInProgressByType,
    addMediaFromExternal,
    fetchUserMedia,
    //addMedia,
    updateMedia,
    deleteMedia,
    clearUserMedia,
    startRealtime,
    stopRealtime,
  };
});
