<script setup lang="ts">
import { computed } from "vue";
import { Sun, Moon, Monitor } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";

/**
 * ThemeToggle — кнопка переключения темы для AppHeader.
 *
 * Показывает три состояния:
 * - Monitor (системная) — пользователь ещё не делал выбор
 * - Sun (светлая) — явно выбрана светлая тема
 * - Moon (тёмная) — явно выбрана тёмная тема
 *
 * Клик переключает между светлой и тёмной.
 * Долгое нажатие / правая кнопка не нужны — системный режим
 * устанавливается автоматически при первом запуске.
 */

const { preference, isDark, toggleTheme } = useTheme();

/**
 * Иконка зависит от текущего выбора пользователя (preference),
 * а не от реальной активной темы (isDark).
 *
 * Это важно: если пользователь выбрал 'system' и система тёмная,
 * мы показываем иконку Monitor — давая понять, что управляет ОС,
 * а не его явный выбор.
 */
const icon = computed(() => {
  if (preference.value === "system") return Monitor;
  if (preference.value === "dark") return Moon;
  return Sun;
});

/**
 * Подсказка для tooltip / title — объясняет текущее состояние
 * и что произойдёт при клике.
 */
const tooltip = computed(() => {
  if (preference.value === "system") {
    return `Системная тема (${isDark() ? "тёмная" : "светлая"}). Нажмите чтобы переключить`;
  }
  if (preference.value === "dark") return "Тёмная тема. Нажмите для светлой";
  return "Светлая тема. Нажмите для тёмной";
});
</script>

<template>
  <!--
    btn-ghost уже определён в style.css через CSS-переменные —
    автоматически адаптируется к теме.

    :title — нативный браузерный tooltip, не требует зависимостей.

    aria-label дублирует tooltip для скринридеров.
  -->
  <button
    @click="toggleTheme"
    class="btn-ghost w-9 h-9 flex items-center justify-center rounded-lg"
    :title="tooltip"
    :aria-label="tooltip"
  >
    <!--
      Анимация смены иконки: каждая иконка — отдельный элемент
      с transition. При смене :is компонента Vue пересоздаёт элемент
      и анимация проигрывается автоматически.
    -->
    <Transition name="icon-swap" mode="out-in">
      <component
        :is="icon"
        :key="preference"
        :size="18"
        class="shrink-0"
      />
    </Transition>
  </button>
</template>

<style scoped>
/*
  Анимация смены иконки: старая уходит вниз с fade,
  новая приходит снизу. mode="out-in" гарантирует
  что сначала уходит старая, потом появляется новая.
*/
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.icon-swap-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.85);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.85);
}
</style>
