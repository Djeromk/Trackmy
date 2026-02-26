import type { ExternalGame, GameById } from '@/types'

const API_KEY = import.meta.env.VITE_RAWG_API_KEY
const BASE_URL = 'https://api.rawg.io/api'

export class GamesService {
  async searchGames(query: string): Promise<ExternalGame[]> {
    const response = await fetch(
      `${BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=20`
    )
    const data = await response.json()

    return data.results.map((item: ExternalGame) => {
      return {
        id: item.id,
        title: item.name,
        thumbnail: item.background_image,
        releaseDate: item.released,
        isSeries: false,
        year: item.released,
        metacritic: item.metacritic,
       other: item
      }
    })
  }

  async getGameDetails(id: string): Promise<GameById> {
    const response = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`)
    if (response.status === 404 || response.status === 400) {
      throw new Error('NOT_FOUND')
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const game = await response.json()

    return game
  }
}

export const gamesService = new GamesService()
