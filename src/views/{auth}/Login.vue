<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Eye, EyeOff } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const email = ref<string>("");
const password = ref<string>("");
const errorMessage = ref<string>("");
const showPassword = ref<boolean>(false);

const isRateLimited = ref(false);
const RATE_LIMIT_MS = 3000;

async function handleLogin(): Promise<void> {
  if (isRateLimited.value) {
    errorMessage.value = "Слишком частые попытки. Подождите несколько секунд.";
    return;
  }

  isRateLimited.value = true;
  setTimeout(() => {
    isRateLimited.value = false;
  }, RATE_LIMIT_MS);

  errorMessage.value = "";

  if (!email.value || !password.value) {
    errorMessage.value = "Пожалуйста, заполните все поля";
    return;
  }

  const result = await authStore.signIn(email.value, password.value);

  if (result.success) {
    // Редиректим на страницу, с которой пришли, или на главную
    const redirect = router.currentRoute.value.query.redirect as
      | string
      | undefined;
    router.push(redirect ?? "/");
  } else {
    errorMessage.value = result.error ?? "Ошибка входа";
  }
}

async function handleDemoLogin(): Promise<void> {
  errorMessage.value = "";

  const result = await authStore.signInAnonymously();

  if (result.success) {
    const redirect = router.currentRoute.value.query.redirect as
      | string
      | undefined;
    router.push(redirect ?? "/");
  } else {
    errorMessage.value = result.error ?? "Ошибка демо-режима";
  }
}
</script>

<template>
  <!-- Корневой контейнер страницы — тёмный фон, flex-column -->
  <div class="auth-page">
    <!-- ── Фоновый слой: сетка + свечение + декоративные слова ───────────── -->
    <div class="auth-bg-layer">
      <!-- Пересекающиеся линии — текстура глубины -->
      <div class="auth-grid-lines"></div>

      <!-- Радиальное свечение под карточкой -->
      <div class="auth-center-glow"></div>

      <!-- Огромные слова-плашки: почти прозрачные, медленно дрейфуют.
           Разные font-size, position и animation-duration — выглядят независимо. -->
      <div
        class="auth-poster"
        style="
          font-size: 18vw;
          top: -5%;
          left: -5%;
          animation: auth-drift 22s ease-in-out infinite alternate;
        "
      >
        FILM
      </div>
      <div
        class="auth-poster"
        style="
          font-size: 12vw;
          bottom: 5%;
          right: -3%;
          animation: auth-drift 26s ease-in-out infinite alternate-reverse;
          animation-delay: -8s;
        "
      >
        READ
      </div>
      <div
        class="auth-poster"
        style="
          font-size: 7vw;
          top: 40%;
          left: 60%;
          animation: auth-drift 18s ease-in-out infinite alternate;
          animation-delay: -5s;
        "
      >
        PLAY
      </div>
    </div>

    <!-- ── Шапка с логотипом ─────────────────────────────────────────────── -->
    <!-- <header class="auth-header">
      <router-link to="/" class="auth-logo">
        <span class="auth-logo-mark">M</span>

        <span class="auth-logo-text">MEDIA<br />ARCHIVE</span>
      </router-link>
    </header> -->

    <!-- ── Центральная зона с карточкой ─────────────────────────────────── -->
    <main class="auth-main">
      <div class="auth-card">
        <!-- Заголовок -->
        <div class="auth-card-header">
          <!-- Eyebrow — маленькая надпись над заголовком -->
          <p class="auth-eyebrow">Добро пожаловать</p>
          <h1 class="auth-title text-(--text-inverse)">Войдите</h1>
          <p class="auth-subtitle">Отслеживайте фильмы, книги и игры</p>
        </div>

        <!-- Форма -->
        <form class="auth-form" @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="auth-field">
            <label class="auth-label" for="login-email">Email</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="auth-input"
            />
          </div>

          <!-- Пароль -->
          <div class="auth-field">
            <label class="auth-label" for="login-password">Пароль</label>
            <!-- Обёртка нужна для кнопки-глаза -->
            <div class="auth-input-wrap">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="auth-input"
              />

              <!-- Кнопка показа пароля -->
              <button
                type="button"
                class="auth-eye-btn"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
              <router-link
            to="/reset-password"
            class="auth-link-muted text-xs block mt-2 text-(--text-primary)"
          >
            Забыли пароль?
          </router-link>
            </div>
          </div>

          <!-- Блок ошибки — появляется только при наличии сообщения -->
          <Transition name="auth-msg">
            <p v-if="errorMessage" class="auth-error-msg">
              {{ errorMessage }}
            </p>
          </Transition>

          <!-- Кнопка входа -->
          <button
            type="submit"
            class="auth-submit"
            :disabled="authStore.loading"
          >
            <!-- Три анимированные точки при загрузке -->
            <span v-if="authStore.loading" class="auth-loading-dots">
              <span></span><span></span><span></span>
            </span>
            <span v-else>Войти</span>
          </button>
        </form>

        <!-- Подвал карточки -->
        <div class="auth-card-footer">
          <span>Нет аккаунта?</span>
          <router-link to="/register" class="auth-link">Создать</router-link>

        </div>
        <div class="auth-card-footer" style="margin-top: 0.5rem">
          <button
            type="button"
            class="auth-link-muted bg-(--muted) rounded-xl p-2 text-(--text-primary) cursor-pointer hover:bg-(--muted-foreground)"
            @click="handleDemoLogin"
          >
            Попробовать демо без аккаунта
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<!-- Локальный transition для сообщений об ошибке.
     Не переносим в style.css потому что это мелкая деталь
     конкретного компонента, а не переиспользуемый класс. -->
<style scoped>
.auth-msg-enter-active,
.auth-msg-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.auth-msg-enter-from,
.auth-msg-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
