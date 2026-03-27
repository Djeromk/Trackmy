// src/services/featuredService.ts

import { supabase } from './supabase'
import type { MediaType } from '@/types'
import type { FeaturedItem } from '@/types/featured'

/**
 * featuredService — загружает кураторские подборки для карусели на главной.
 *
 * Запрашивает media_items с is_featured = true, фильтруя по типу медиа.
 * Сортировка по created_at DESC — последние добавленные ты видишь первыми,
 * что удобно при ручном кураторстве через Dashboard.
 */
export const featuredService = {
  async getFeaturedByType(type: MediaType): Promise<FeaturedItem[]> {
    const { data, error } = await supabase
      .from('media_items')
      .select('id, type, title, cover_url, external_id, is_featured')
      .eq('type', type)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // data не может быть null при отсутствии ошибки — Supabase возвращает []
    return data as FeaturedItem[]
  },

  /**
   * Загружает все три секции одним вызовом параллельно.
   * Promise.all гарантирует что все три запроса летят одновременно,
   * а не последовательно — суммарное время ≈ времени одного запроса.
   */
  async getAllFeatured(): Promise<{
    movies: FeaturedItem[]
    books: FeaturedItem[]
    games: FeaturedItem[]
  }> {
    const [movies, books, games] = await Promise.all([
      this.getFeaturedByType('movie'),
      this.getFeaturedByType('book'),
      this.getFeaturedByType('game'),
    ])

    return { movies, books, games }
  },
}
