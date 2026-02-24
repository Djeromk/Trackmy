import { ref, onUnmounted } from "vue";

/**
 * Три возможных состояния темы:
 * - 'light'  — пользователь явно выбрал светлую
 * - 'dark'   — пользователь явно выбрал тёмную
 * - 'system' — следовать настройке устройства (по умолчанию)
 */
type ThemePreference = "light" | "dark" | "system";

/**
 * Ключ в localStorage для хранения явного выбора пользователя.
 * Если ключ отсутствует — значит пользователь ничего не выбирал
 * и мы следуем системной теме.
 */
const STORAGE_KEY = "theme-preference";

/**
 * ref живёт вне функции composable — он синглтон на всё приложение.
 * Это значит, что все компоненты, вызвавшие useTheme(),
 * работают с одним и тем же реактивным состоянием.
 */
const preference = ref<ThemePreference>(
  (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? "system"
);

/**
 * Читает текущую системную тему через matchMedia.
 * Возвращает 'dark' или 'light' — никогда не 'system'.
 */
function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Вычисляет реальную тему для применения к DOM.
 * Если пользователь выбрал 'system' — возвращает тему устройства.
 */
function resolveTheme(pref: ThemePreference): "light" | "dark" {
  return pref === "system" ? getSystemTheme() : pref;
}

/**
 * Применяет тему к <html>: добавляет или убирает класс .dark.
 * Все CSS-переменные в компонентах обновятся автоматически —
 * они ссылаются на :root и .dark через var(--...).
 */
function applyTheme(pref: ThemePreference): void {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Слушатель изменения системной темы.
 * Срабатывает когда пользователь меняет тему в ОС.
 * Мы реагируем ТОЛЬКО если выбор пользователя — 'system'.
 */
function handleSystemThemeChange(): void {
  if (preference.value === "system") {
    applyTheme("system");
  }
}

/**
 * Применяем тему сразу при загрузке модуля — ещё до монтирования
 * любого компонента. Это предотвращает мелькание (FOUC):
 * страница сразу рендерится в правильной теме.
 */
applyTheme(preference.value);

/**
 * MediaQueryList — объект браузера для отслеживания медиазапросов.
 * Мы держим ссылку снаружи чтобы добавить и потом корректно
 * удалить один и тот же слушатель.
 */
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Регистрируем слушатель системной темы один раз на всё приложение.
// addEventListener с { passive: true } — браузерная оптимизация
// для событий, которые не вызывают preventDefault().
mediaQuery.addEventListener("change", handleSystemThemeChange, {
  passive: true,
});

/**
 * useTheme — composable для управления темой приложения.
 *
 * Использование:
 *   const { preference, isDark, setTheme, toggleTheme } = useTheme()
 *
 * Вызывай в любом компоненте — все получат одно общее состояние.
 * onUnmounted очищает слушатель только при уничтожении последнего
 * компонента, использующего composable (на практике — App.vue).
 */
export function useTheme() {
  /**
   * isDark — вычисленное булевое значение.
   * true если реальная активная тема тёмная.
   * Используй в шаблонах: v-if="isDark", :class="{ dark: isDark }".
   *
   * Не вычисляем через computed чтобы не тянуть import из vue —
   * вычисляем функцией getSystemTheme() в нужный момент.
   */
  function isDark(): boolean {
    return resolveTheme(preference.value) === "dark";
  }

  /**
   * setTheme — явный выбор темы пользователем.
   *
   * 'light' | 'dark' — сохраняется в localStorage,
   *   пользователь больше не следует системе.
   * 'system' — удаляем ключ из localStorage,
   *   снова начинаем следовать устройству.
   */
  function setTheme(newPref: ThemePreference): void {
    preference.value = newPref;

    if (newPref === "system") {
      // Явного выбора нет — удаляем запись,
      // чтобы при следующей загрузке снова читать систему.
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, newPref);
    }

    applyTheme(newPref);
  }

  /**
   * toggleTheme — переключение между светлой и тёмной.
   *
   * Логика: смотрим на то, что СЕЙЧАС активно (resolved тема),
   * и переключаем в противоположное. После нажатия кнопки
   * пользователь всегда получает явный выбор — 'system' сбрасывается.
   *
   * Пример: устройство в тёмной → preference='system' →
   *   isDark()=true → после toggle → preference='light'
   */
  function toggleTheme(): void {
    setTheme(isDark() ? "light" : "dark");
  }

  /**
   * Очищаем слушатель системной темы при размонтировании компонента.
   * В реальности это нужно только если весь App.vue уничтожается,
   * но хорошая практика — всегда убирать за собой.
   */
  onUnmounted(() => {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  });

  return {
    /** Текущий выбор: 'light' | 'dark' | 'system' */
    preference,
    /** true если активная тема тёмная (учитывает системную) */
    isDark,
    /** Установить конкретную тему или вернуться к системной */
    setTheme,
    /** Переключить между светлой и тёмной */
    toggleTheme,
  };
}
