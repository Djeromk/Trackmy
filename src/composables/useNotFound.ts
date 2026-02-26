import { useRouter } from 'vue-router'

/**
 * useNotFound — composable для обработки 404 ошибок из API.
 *
 * Проблема: когда API возвращает 404 (фильм/книга/игра не найдена),
 * нам нужно показать страницу NotFound.vue — но ErrorBoundary для этого
 * не подходит, он показывает generic "что-то пошло не так".
 *
 * Решение: программная навигация через router.replace() на именованный
 * роут 'not-found'. replace() вместо push() — чтобы страница 404
 * не попала в историю навигации и кнопка "Назад" в браузере вела
 * на предыдущую страницу, а не зацикливалась на 404.
 *
 * Использование в компоненте страницы:
 *
 *   const { redirectToNotFound, isNotFoundError } = useNotFound()
 *
 *   onMounted(async () => {
 *     try {
 *       movie.value = await kinopoiskService.searchMovieByID(movieId)
 *     } catch (e) {
 *       if (isNotFoundError(e)) {
 *         redirectToNotFound()
 *         return
 *       }
 *       error.value = 'Не удалось загрузить фильм'
 *     }
 *   })
 */
export function useNotFound() {
  const router = useRouter()

  /**
   * Перенаправляет на страницу 404.
   *
   * Использует replace() чтобы текущий URL не сохранялся в истории.
   * Это важно для UX: если пользователь нажмёт "Назад" — он вернётся
   * туда откуда пришёл, а не застрянет в петле broken-url → 404 → broken-url.
   */
  function redirectToNotFound(): void {
    router.replace({ name: 'not-found' })
  }

  /**
   * Определяет является ли ошибка 404.
   *
   * Проверяем несколько вариантов потому что разные API
   * возвращают ошибки по-разному:
   *
   * - Kinopoisk возвращает response.status === 404 (HTTP статус)
   * - Google Books может вернуть { error: { code: 404 } } в теле
   * - RAWG возвращает { detail: "Not found." }
   * - Fetch сам по себе не бросает ошибку на 4xx — нужно проверять response.ok
   *
   * Поэтому проверяем:
   * 1. HTTP статус в объекте ошибки (если сервис прокидывает status)
   * 2. Текст сообщения ошибки
   * 3. Числовой код
   */
  function isNotFoundError(error: unknown): boolean {
    if (error == null) return false

    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      // Текстовые маркеры 404 из разных API
      if (
        message.includes('404') ||
        message.includes('not found') ||
        message.includes('не найден') ||
        message.includes('does not exist')
      ) {
        return true
      }
    }

    // Объект с числовым полем status (например { status: 404, message: '...' })
    if (typeof error === 'object' && 'status' in error) {
      return (error as { status: number }).status === 404
    }

    return false
  }

  return {
    redirectToNotFound,
    isNotFoundError,
  }
}
