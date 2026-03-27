// src/types/featured.ts

import type { MediaType, MediaStatus, UserMedia } from './index'

/**
 * FeaturedItem — запись из media_items с is_featured = true.
 *
 * Содержит только поля необходимые для отображения карусели.
 * Намеренно не расширяет BaseMedia — BaseMedia содержит поля
 * которые появляются только после того как пользователь добавил
 * элемент в список (coverUrl vs cover_url, camelCase маппинг и т.д.).
 * Здесь работаем напрямую с snake_case ответом Supabase.
 */
export interface FeaturedItem {
  id: string
  type: MediaType
  title: string
  cover_url: string | null
  external_id: string
}

/**
 * FeaturedItemEnriched — FeaturedItem обогащённый данными из userMedia.
 *
 * Используется в карусели чтобы показать текущий статус пользователя
 * для каждой карточки без дополнительных запросов к БД.
 * Вычисляется на фронте из userMedia store.
 */
export interface FeaturedItemEnriched extends FeaturedItem {
  /** true если этот элемент уже есть в списке пользователя */
  isAdded: boolean
  /** текущий статус если добавлен, иначе null */
  currentStatus: MediaStatus | null
  /** id записи user_media если добавлен — нужен для updateMedia */
  userMediaId: string | null
}

/**
 * Результат getAllFeatured — три секции для главной страницы.
 */
export interface AllFeatured {
  movies: FeaturedItem[]
  books: FeaturedItem[]
  games: FeaturedItem[]
}
