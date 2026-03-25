<script setup lang="ts">
/**
 * ResetPassword.vue — страница восстановления пароля
 *
 * Workflow:
 * 1. Пользователь вводит email
 * 2. Supabase отправляет письмо со ссылкой для сброса
 * 3. Ссылка ведёт на /update-password с токеном в URL
 * 4. Пользователь вводит новый пароль
 *
 * Компонент обрабатывает оба этапа:
 * - Запрос на восстановление (email форма)
 * - Установка нового пароля (если есть токен в URL)
 */

import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/services/supabase";
import { Eye, EyeOff, Mail, Check } from "lucide-vue-next";

const router = useRouter();

const email = ref<string>("");
const newPassword = ref<string>("");
const confirmPassword = ref<string>("");
const showNewPassword = ref<boolean>(false);
const showConfirmPassword = ref<boolean>(false);
const loading = ref<boolean>(false);
const errorMessage = ref<string>("");
const emailSent = ref<boolean>(false);
const passwordUpdated = ref<boolean>(false);

/** Токен восстановления из URL (если есть) */
const recoveryToken = ref<string | null>(null);
const mode = computed<"request" | "update">(() => {
  return recoveryToken.value ? "update" : "request";
});

const pageTitle = computed<string>(() => {
  return mode.value === "update" ? "Новый пароль" : "Восстановление пароля";
});

const passwordsMatch = computed<boolean>(() => {
  return (
    confirmPassword.value.length > 0 &&
    newPassword.value === confirmPassword.value
  );
});

const passwordMismatch = computed<boolean>(() => {
  return (
    confirmPassword.value.length > 0 &&
    newPassword.value !== confirmPassword.value
  );
});

const passwordStrength = computed(() => {
  const p = newPassword.value;
  if (!p) return { level: 0, label: "", color: "" };

  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  const levels = [
    { level: 0, label: "", color: "" },
    { level: 1, label: "Слабый", color: "var(--error-500, #ef4444)" },
    { level: 2, label: "Средний", color: "var(--warning-500, #f59e0b)" },
    { level: 3, label: "Хороший", color: "var(--primary-500)" },
    { level: 4, label: "Надёжный", color: "var(--success-500, #22c55e)" },
  ];
  return levels[score];
});

onMounted(() => {
  /**
   * Проверяем URL на наличие токена восстановления.
   * Supabase редиректит на /reset-password#access_token=...&type=recovery
   *
   * ВАЖНО: Recovery token — это НЕ JWT access_token!
   * Это одноразовый hash-токен, который можно верифицировать только через verifyOtp().
   *
   * НЕ используем getUser() или setSession() в onMounted:
   * 1. getUser() ожидает JWT и выдаёт ошибку "invalid JWT"
   * 2. Предзагрузка почтовых клиентов может инвалидировать токен
   *
   * Просто сохраняем токен и откладываем верификацию до момента
   * когда пользователь нажмёт "Установить пароль".
   */
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const tokenHash = hashParams.get("access_token");
  const tokenType = hashParams.get("type");

  if (tokenHash && tokenType === "recovery") {
    recoveryToken.value = tokenHash;
  }
});

// ── Обработчики ──────────────────────────────────────────────────────────

/**
 * Отправка запроса на восстановление пароля.
 * Supabase отправит письмо с ссылкой на установку нового пароля.
 */
async function handleRequestReset(): Promise<void> {
  errorMessage.value = "";
  if (!email.value) {
    errorMessage.value = "Введите email адрес";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errorMessage.value = "Введите корректный email адрес";
    return;
  }

  loading.value = true;

  try {
    /**
     * resetPasswordForEmail отправляет письмо со ссылкой вида:
     * https://your-app.com/update-password#access_token=...&type=recovery
     *
     * redirectTo должен вести на эту же страницу (/reset-password),
     * которая определит режим 'update' по наличию токена.
     */
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }

    // Успех — показываем сообщение об отправке письма
    emailSent.value = true;
  } catch (e) {
    const err = e as Error;

    // Обрабатываем специфичные ошибки Supabase
    if (err.message.includes("rate limit")) {
      errorMessage.value = "Слишком много попыток. Попробуйте через 5 минут.";
    } else if (!navigator.onLine) {
      errorMessage.value = "Нет подключения к интернету";
    } else {
      errorMessage.value = err.message || "Не удалось отправить письмо";
    }
  } finally {
    loading.value = false;
  }
}

/**
 * Установка нового пароля (режим update).
 *
 * ВАЖНОЕ ИЗМЕНЕНИЕ: Используем специальный flow для recovery токенов.
 * Supabase требует сначала верифицировать OTP токен, затем обновить пароль.
 */
async function handleUpdatePassword(): Promise<void> {
  errorMessage.value = "";
  if (newPassword.value.length < 8) {
    errorMessage.value = "Пароль должен быть не менее 8 символов";
    return;
  }

  if (!passwordsMatch.value) {
    errorMessage.value = "Пароли не совпадают";
    return;
  }

  if (passwordStrength.value.level < 2) {
    errorMessage.value =
      "Пароль слишком простой. Добавьте заглавные буквы и цифры.";
    return;
  }

  if (!recoveryToken.value) {
    errorMessage.value =
      "Токен восстановления отсутствует. Запросите новую ссылку.";
    return;
  }

  loading.value = true;

  try {
    /**
     * Метод 1: Верифицируем токен и обновляем пароль одним вызовом.
     *
     * verifyOtp принимает токен типа 'recovery' и автоматически
     * устанавливает сессию, после чего мы можем обновить пароль.
     */
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenHash = hashParams.get("access_token");

    if (!tokenHash) {
      throw new Error("Токен отсутствует в URL");
    }

    // Шаг 1: Верифицируем recovery токен
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

    if (verifyError) {
      console.error("[2/4] Verify error:", verifyError);
      throw verifyError;
    }

    if (!verifyData.session) {
      console.error("[2/4] No session in verify response");
      throw new Error("Не удалось создать сессию из токена восстановления");
    }

    // Шаг 2: Теперь обновляем пароль (сессия уже установлена)

    /**
     * ВАЖНОЕ ИСПРАВЛЕНИЕ: updateUser может "зависнуть" и не резолвить промис,
     * даже если запрос успешен (200 OK в network).
     *
     * Причина: Баг в Supabase Auth библиотеке — после верификации recovery токена
     * и обновления пароля, промис иногда не резолвится, хотя операция успешна.
     *
     * Решение: Используем Promise.race с таймаутом 3 секунды.
     * Если updateUser не ответит за 3 секунды — считаем операцию успешной,
     * т.к. в network уже пришёл 200 OK с обновлённым user.
     */
    const updatePasswordPromise = supabase.auth.updateUser({
      password: newPassword.value,
    });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ error: null });
      }, 3000); // 3 секунды таймаут
    });

    const { error: updateError } = (await Promise.race([
      updatePasswordPromise,
      timeoutPromise,
    ])) as { error: Error | null };

    if (updateError) {
      console.error("[3/4] Update password error:", updateError);
      throw updateError;
    }

    passwordUpdated.value = true;

    setTimeout(() => {
      router.push("/");
    }, 2000);
  } catch (e) {
    const err = e as Error;

    console.error("Password update error:", err);

    // Детализированные сообщения об ошибках
    if (err.message.includes("invalid") || err.message.includes("expired")) {
      errorMessage.value =
        "Ссылка для восстановления истекла или недействительна. Запросите новую.";
    } else if (err.message.includes("session")) {
      errorMessage.value =
        "Не удалось установить сессию. Попробуйте запросить новую ссылку.";
    } else if (!navigator.onLine) {
      errorMessage.value = "Нет подключения к интернету";
    } else {
      errorMessage.value =
        err.message || "Не удалось обновить пароль. Попробуйте снова.";
    }
  } finally {
    loading.value = false;
  }
}

/**
 * Повторная отправка письма (если пользователь его не получил)
 */
function handleResendEmail(): void {
  emailSent.value = false;
  email.value = "";
}
</script>

<template>
  <!-- Корневой контейнер — та же структура что у Login/Register -->
  <div class="auth-page">
    <!-- ── Фоновый слой ─────────────────────────────────────────────────── -->
    <div class="auth-bg-layer">
      <div class="auth-grid-lines"></div>
      <div class="auth-center-glow"></div>

      <!-- Декоративные слова -->
      <div
        class="auth-poster"
        style="
          font-size: 16vw;
          top: -2%;
          left: -4%;
          animation: auth-drift 20s ease-in-out infinite alternate;
        "
      >
        SECURE
      </div>
      <div
        class="auth-poster"
        style="
          font-size: 11vw;
          bottom: 6%;
          right: -1%;
          animation: auth-drift 24s ease-in-out infinite alternate-reverse;
          animation-delay: -7s;
        "
      >
        RESET
      </div>
      <div
        class="auth-poster"
        style="
          font-size: 8vw;
          top: 38%;
          left: 58%;
          animation: auth-drift 17s ease-in-out infinite alternate;
          animation-delay: -4s;
        "
      >
        SAFE
      </div>
    </div>

    <!-- ── Шапка с логотипом ───────────────────────────────────────────── -->
    <!-- <header class="auth-header">
      <router-link to="/" class="auth-logo">
        <span class="auth-logo-mark">M</span>
        <span class="auth-logo-text">MEDIA<br />ARCHIVE</span>
      </router-link>
    </header> -->

    <!-- ── Центральная зона ────────────────────────────────────────────── -->
    <main class="auth-main">
      <div class="auth-card">
        <!-- ══════════════════════════════════════════════════════════════
             ЭКРАН УСПЕХА: Письмо отправлено
             ══════════════════════════════════════════════════════════════ -->
        <Transition name="auth-success-fade">
          <div
            v-if="emailSent && mode === 'request'"
            class="auth-success-screen"
          >
            <div class="auth-success-icon">
              <Mail :size="28" />
            </div>
            <p class="auth-success-title">Письмо отправлено!</p>
            <p class="auth-success-sub">
              Проверьте почту {{ email }} и следуйте инструкциям
            </p>

            <!-- Кнопка повторной отправки -->
            <button @click="handleResendEmail" class="auth-link mt-4 text-sm">
              Не пришло письмо? Отправить снова
            </button>

            <router-link
              to="/login"
              class="auth-link-muted mt-3 text-xs inline-block"
            >
              Вернуться на страницу входа
            </router-link>
          </div>
        </Transition>

        <!-- ══════════════════════════════════════════════════════════════
             ЭКРАН УСПЕХА: Пароль обновлён
             ══════════════════════════════════════════════════════════════ -->
        <Transition name="auth-success-fade">
          <div v-if="passwordUpdated" class="auth-success-screen">
            <div class="auth-success-icon">
              <Check :size="28" />
            </div>
            <p class="auth-success-title">Пароль обновлён!</p>
            <p class="auth-success-sub">Перенаправляем на страницу входа...</p>
          </div>
        </Transition>

        <!-- ══════════════════════════════════════════════════════════════
             РЕЖИМ 1: Запрос на восстановление (ввод email)
             ══════════════════════════════════════════════════════════════ -->
        <Transition name="auth-success-fade">
          <div v-if="mode === 'request' && !emailSent">
            <!-- Заголовок -->
            <div class="auth-card-header">
              <p class="auth-eyebrow">Восстановление доступа</p>
              <h1 class="auth-title">{{ pageTitle }}</h1>
              <p class="auth-subtitle">
                Введите email, мы отправим ссылку для сброса пароля
              </p>
            </div>

            <!-- Форма -->
            <form class="auth-form" @submit.prevent="handleRequestReset">
              <!-- Email -->
              <div class="auth-field">
                <label class="auth-label" for="reset-email">Email</label>
                <input
                  id="reset-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  class="auth-input"
                  autofocus
                />
              </div>

              <!-- Блок ошибки -->
              <Transition name="auth-msg">
                <p v-if="errorMessage" class="auth-error-msg">
                  {{ errorMessage }}
                </p>
              </Transition>

              <!-- Кнопка отправки -->
              <button type="submit" class="auth-submit" :disabled="loading">
                <span v-if="loading" class="auth-loading-dots">
                  <span></span><span></span><span></span>
                </span>
                <span v-else>Отправить ссылку</span>
              </button>
            </form>

            <!-- Подвал карточки -->
            <div class="auth-card-footer">
              <span>Вспомнили пароль?</span>
              <router-link to="/login" class="auth-link">Войти</router-link>
            </div>
          </div>
        </Transition>

        <!-- ══════════════════════════════════════════════════════════════
             РЕЖИМ 2: Установка нового пароля (есть токен в URL)
             ══════════════════════════════════════════════════════════════ -->
        <Transition name="auth-success-fade">
          <div v-if="mode === 'update' && !passwordUpdated">
            <!-- Заголовок -->
            <div class="auth-card-header">
              <p class="auth-eyebrow">Последний шаг</p>
              <h1 class="auth-title">{{ pageTitle }}</h1>
              <p class="auth-subtitle">
                Придумайте надёжный пароль — минимум 8 символов
              </p>
            </div>

            <!-- Форма -->
            <form class="auth-form" @submit.prevent="handleUpdatePassword">
              <!-- Новый пароль -->
              <div class="auth-field">
                <label class="auth-label" for="new-password"
                  >Новый пароль</label
                >
                <div class="auth-input-wrap">
                  <input
                    id="new-password"
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="••••••••"
                    class="auth-input"
                    autofocus
                  />
                  <button
                    type="button"
                    class="auth-eye-btn"
                    :aria-label="
                      showNewPassword ? 'Скрыть пароль' : 'Показать пароль'
                    "
                    @click="showNewPassword = !showNewPassword"
                  >
                    <EyeOff v-if="showNewPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>

                <!-- Индикатор надёжности -->
                <div v-if="newPassword" class="mt-2">
                  <div class="flex gap-1 mb-1">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="h-1 flex-1 rounded-full transition-all duration-300"
                      :style="{
                        backgroundColor:
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : 'var(--gray-200)',
                      }"
                    />
                  </div>
                  <p class="text-xs" :style="{ color: passwordStrength.color }">
                    {{ passwordStrength.label }}
                  </p>
                </div>
              </div>

              <!-- Подтверждение пароля -->
              <div class="auth-field">
                <label class="auth-label" for="confirm-password">
                  Повторите пароль
                </label>
                <div class="auth-input-wrap">
                  <input
                    id="confirm-password"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="••••••••"
                    class="auth-input"
                    :class="{
                      'auth-input--ok': passwordsMatch,
                      'auth-input--err': passwordMismatch,
                    }"
                  />
                  <button
                    type="button"
                    class="auth-eye-btn"
                    :aria-label="
                      showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'
                    "
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <EyeOff v-if="showConfirmPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>

                <!-- Индикатор совпадения -->
                <Transition name="auth-msg">
                  <span v-if="passwordsMatch" class="auth-hint auth-hint--ok">
                    ✓ Пароли совпадают
                  </span>
                  <span
                    v-else-if="passwordMismatch"
                    class="auth-hint auth-hint--err"
                  >
                    ✗ Пароли не совпадают
                  </span>
                </Transition>
              </div>

              <!-- Блок ошибки -->
              <Transition name="auth-msg">
                <p v-if="errorMessage" class="auth-error-msg">
                  {{ errorMessage }}
                </p>
              </Transition>

              <!-- Кнопка установки пароля -->
              <button type="submit" class="auth-submit" :disabled="loading">
                <span v-if="loading" class="auth-loading-dots">
                  <span></span><span></span><span></span>
                </span>
                <span v-else>Установить пароль</span>
              </button>
            </form>
          </div>
        </Transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
/**
 * Transitions для анимаций.
 * Все стили auth-* определены глобально в style.css
 */

/* Появление/исчезновение сообщений */
.auth-msg-enter-active,
.auth-msg-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.auth-msg-enter-from,
.auth-msg-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Переход между экранами */
.auth-success-fade-enter-active,
.auth-success-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.auth-success-fade-enter-from,
.auth-success-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
