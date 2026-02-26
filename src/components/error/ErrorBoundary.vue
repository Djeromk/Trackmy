<script setup lang="ts">
/**
 * ErrorBoundary — компонент-ловушка ошибок.
 *
 * Принцип работы:
 * Vue предоставляет хук onErrorCaptured(), который перехватывает
 * любую ошибку, брошенную в дочерних компонентах — рендер, lifecycle,
 * event handlers, async setup. Без этого компонента ошибка "всплывёт"
 * до корня приложения и убьёт весь UI.
 *
 * Использование:
 *   <ErrorBoundary>
 *     <ВашКомпонент />
 *   </ErrorBoundary>
 *
 * Дополнительный слот #fallback для кастомного UI при ошибке:
 *   <ErrorBoundary>
 *     <ВашКомпонент />
 *     <template #fallback="{ error, reset }">
 *       <p>{{ error.message }}</p>
 *       <button @click="reset">Повторить</button>
 *     </template>
 *   </ErrorBoundary>
 */
import { ref, onErrorCaptured } from 'vue'

/**
 * Пропс resetOnUpdate: если true — ErrorBoundary автоматически
 * сбрасывает ошибку при обновлении пропсов родителя.
 * Полезно когда контент меняется (например, пользователь перешёл
 * на другую страницу) и нужно дать компоненту ещё один шанс.
 */
interface Props {
  resetOnUpdate?: boolean
}

withDefaults(defineProps<Props>(), {
  resetOnUpdate: false,
})

/** Текущая пойманная ошибка. null — значит всё ок, рендерим slot по умолчанию */
const error = ref<Error | null>(null)

/**
 * Информация об источнике ошибки.
 * Vue передаёт строку вида "in component <ComponentName>"
 * или "in watcher for ..." — помогает при отладке.
 */
const errorInfo = ref<string>('')

/**
 * Сброс состояния ошибки — показываем дочерний компонент снова.
 * Передаётся в slot как функция, чтобы пользователь мог вызвать
 * reset из кнопки "Попробовать снова".
 */
function reset(): void {
  error.value = null
  errorInfo.value = ''
}

/**
 * Полная перезагрузка страницы.
 *
 * Вынесена в функцию вместо инлайн-вызова window.location.reload()
 * в template — иначе TypeScript в Vue template context не находит
 * глобальный объект window и выдаёт ошибку компиляции.
 *
 * В <script setup> window доступен как обычный глобал браузера.
 */
function reloadPage(): void {
  window.location.reload()
}

/**
 * onErrorCaptured перехватывает ошибки из всего поддерева.
 *
 * Возвращаем false — это говорит Vue НЕ распространять ошибку
 * дальше вверх по дереву компонентов. Мы её обработали сами.
 *
 * Если вернуть true (или ничего) — ошибка пойдёт к следующему
 * ErrorBoundary или до глобального app.config.errorHandler.
 */
onErrorCaptured((err: Error, _instance, info: string): false => {
  error.value = err
  errorInfo.value = info

  // Логируем в консоль для разработчика, даже если показываем UI
  console.error('[ErrorBoundary] Поймана ошибка:', err)
  console.error('[ErrorBoundary] Источник:', info)

  return false
})
</script>

<template>
  <!--
    Если ошибки нет — рендерим дочерний контент как обычно.
    Если есть ошибка:
    1. Проверяем, передан ли кастомный #fallback слот
    2. Если да — рендерим его с доступом к { error, reset }
    3. Если нет — показываем встроенный fallback UI
  -->
  <slot v-if="!error" />

  <template v-else>
    <!--
      Кастомный fallback: родитель сам решает что показать.
      Пример: <template #fallback="{ error, reset }"> ... </template>
    -->
    <slot
      v-if="$slots.fallback"
      name="fallback"
      :error="error"
      :reset="reset"
    />

    <!-- Встроенный fallback UI — используется по умолчанию -->
    <div
      v-else
      class="error-boundary-fallback"
      role="alert"
      aria-live="assertive"
    >
      <!-- Иконка предупреждения — SVG без зависимостей -->
      <div class="error-boundary-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h3 class="error-boundary-title">Что-то пошло не так</h3>

      <p class="error-boundary-message">
        Произошла непредвиденная ошибка в этом разделе.
        Остальная часть приложения работает нормально.
      </p>

      <!--
        Технические детали — скрыты в <details>.
        Пользователь не видит технический шум, но может
        раскрыть для отправки баг-репорта.
      -->
      <details class="error-boundary-details">
        <summary>Технические детали</summary>
        <div class="error-boundary-stack">
          <p class="error-boundary-stack-message">{{ error?.message }}</p>
          <p v-if="errorInfo" class="error-boundary-stack-info">{{ errorInfo }}</p>
          <pre v-if="error?.stack" class="error-boundary-stack-trace">{{ error.stack }}</pre>
        </div>
      </details>

      <div class="error-boundary-actions">
        <!--
          reset() — сбрасывает состояние ошибки.
          Компонент попробует отрендериться заново.
        -->
        <button class="error-boundary-btn error-boundary-btn--primary" @click="reset">
          Попробовать снова
        </button>

        <!--
          Полная перезагрузка страницы — последний резерв.
          Решает проблемы с corrupted state в сторах.
        -->
        <button class="error-boundary-btn error-boundary-btn--secondary" @click="reloadPage">
          Перезагрузить страницу
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.error-boundary-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  margin: 1rem 0;
  border-radius: var(--border-radius-lg, 1rem);
  background-color: var(--background-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  gap: 0.75rem;
}

.error-boundary-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fef2f2;
  color: #ef4444;
  margin-bottom: 0.25rem;
  flex-shrink: 0;
}

.dark .error-boundary-icon {
  background-color: rgba(239, 68, 68, 0.12);
}

.error-boundary-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-semibold, 600);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight, 1.2);
}

.error-boundary-message {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-tertiary);
  margin: 0;
  max-width: 36ch;
  line-height: var(--leading-relaxed, 1.625);
}

.error-boundary-details {
  width: 100%;
  max-width: 480px;
  text-align: left;
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-tertiary);
  cursor: pointer;
}

.error-boundary-details summary {
  padding: 0.5rem 0;
  user-select: none;
  transition: color 150ms;
}

.error-boundary-details summary:hover {
  color: var(--text-secondary);
}

.error-boundary-stack {
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--border-radius-base, 0.5rem);
  background-color: var(--background-subtle, #f9fafb);
  border: 1px solid var(--border-color-subtle);
  overflow: auto;
}

.error-boundary-stack-message {
  font-weight: var(--font-semibold, 600);
  color: #ef4444;
  margin: 0 0 0.25rem;
}

.error-boundary-stack-info {
  color: var(--text-tertiary);
  margin: 0 0 0.5rem;
}

.error-boundary-stack-trace {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  line-height: 1.6;
}

.error-boundary-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}

.error-boundary-btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--border-radius-base, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: all 150ms;
  border: 1px solid transparent;
}

.error-boundary-btn--primary {
  background-color: var(--primary-500);
  color: white;
}

.error-boundary-btn--primary:hover {
  background-color: var(--primary-600);
}

.error-boundary-btn--secondary {
  background-color: var(--background-card);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.error-boundary-btn--secondary:hover {
  background-color: var(--background-hover);
}
</style>
