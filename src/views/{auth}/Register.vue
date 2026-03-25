<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Eye, EyeOff, Check } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

// ── Состояние полей ──────────────────────────────────────────────────────────

const email = ref<string>("");
const name = ref<string>("");
const password = ref<string>("");
const confirmPassword = ref<string>("");
const errorMessage = ref<string>("");

const showPassword = ref<boolean>(false);
const showConfirmPassword = ref<boolean>(false);

const isSuccess = ref<boolean>(false);

const passwordsMatch = computed<boolean>(
  () =>
    confirmPassword.value.length > 0 &&
    password.value === confirmPassword.value,
);

const passwordMismatch = computed<boolean>(
  () =>
    confirmPassword.value.length > 0 &&
    password.value !== confirmPassword.value,
);

function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function handleRegister(): Promise<void> {
  errorMessage.value = "";

  if (!isValidEmailFormat(email.value)) {
    errorMessage.value = "Введите корректный email адрес";
    return;
  }

  if (
    !email.value ||
    !name.value ||
    !password.value ||
    !confirmPassword.value
  ) {
    errorMessage.value = "Пожалуйста, заполните все поля";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Пароли не совпадают";
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = "Пароль должен быть не менее 6 символов";
    return;
  }

  if (name.value.trim().length < 2) {
    errorMessage.value = "Имя должно быть не менее 2 символов";
    return;
  }

  const result = await authStore.signUp(
    email.value,
    password.value,
    name.value,
  );

  if (result.success) {
    isSuccess.value = true;
    setTimeout(() => {
      router.push("/");
    }, 1800);
  } else {
    errorMessage.value = result.error ?? "Ошибка регистрации";
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg-layer">
      <div class="auth-grid-lines"></div>
      <div class="auth-center-glow"></div>

      <div
        class="auth-poster"
        style="
          font-size: 14vw;
          top: -3%;
          right: -2%;
          animation: auth-drift 24s ease-in-out infinite alternate;
        "
      >
        WATCH
      </div>
      <div
        class="auth-poster"
        style="
          font-size: 10vw;
          bottom: 8%;
          left: -2%;
          animation: auth-drift 20s ease-in-out infinite alternate-reverse;
          animation-delay: -10s;
        "
      >
        PLAY
      </div>
      <div
        class="auth-poster"
        style="
          font-size: 7vw;
          top: 35%;
          left: 55%;
          animation: auth-drift 16s ease-in-out infinite alternate;
          animation-delay: -3s;
        "
      >
        READ
      </div>
    </div>

    <!-- <header class="auth-header">
      <router-link to="/" class="auth-logo">
        <span class="auth-logo-mark">M</span>
        <span class="auth-logo-text">MEDIA<br />ARCHIVE</span>
      </router-link>
    </header> -->

    <main class="auth-main">
      <div class="auth-card auth-card--wide">
        <Transition name="auth-success-fade">
          <div v-if="isSuccess" class="auth-success-screen">
            <div class="auth-success-icon">
              <Check :size="28" />
            </div>
            <p class="auth-success-title">Аккаунт создан!</p>
            <p class="auth-success-sub">Перенаправляем…</p>
          </div>
        </Transition>

        <Transition name="auth-success-fade">
          <div v-if="!isSuccess">
            <!-- Заголовок -->
            <div class="auth-card-header">
              <p class="auth-eyebrow">Новый аккаунт</p>
              <h1 class="auth-title text-(--text-inverse)" style="font-size: 1.875rem">
                Регистрация
              </h1>
              <p class="auth-subtitle">Начните отслеживать свою коллекцию</p>
            </div>

            <!-- Форма -->
            <form class="auth-form" @submit.prevent="handleRegister">
              <!-- Email -->
              <div class="auth-field">
                <label class="auth-label" for="reg-email">Email</label>
                <input
                  id="reg-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  class="auth-input"
                />
              </div>

              <!-- Имя -->
              <div class="auth-field">
                <label class="auth-label" for="reg-name">Ваше имя</label>
                <input
                  id="reg-name"
                  v-model="name"
                  type="text"
                  autocomplete="name"
                  placeholder="Алиса"
                  class="auth-input"
                />
              </div>

              <!-- Пароль + Подтверждение — двухколоночная сетка на десктопе.
                   На мобильных (<520px) схлопывается через @media в style.css. -->
              <div class="auth-fields-row">
                <!-- Пароль -->
                <div class="auth-field">
                  <label class="auth-label" for="reg-password">Пароль</label>
                  <div class="auth-input-wrap">
                    <input
                      id="reg-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="••••••••"
                      class="auth-input"
                    />
                    <button
                      type="button"
                      class="auth-eye-btn"
                      :aria-label="
                        showPassword ? 'Скрыть пароль' : 'Показать пароль'
                      "
                      @click="showPassword = !showPassword"
                    >
                      <EyeOff v-if="showPassword" :size="15" />
                      <Eye v-else :size="15" />
                    </button>
                  </div>
                  <!-- Подсказка: минимум символов -->
                  <span class="auth-hint">Не менее 6 символов</span>
                </div>

                <!-- Подтверждение пароля -->
                <div class="auth-field">
                  <label class="auth-label" for="reg-confirm"
                    >Повторите пароль</label
                  >
                  <div class="auth-input-wrap">
                    <input
                      id="reg-confirm"
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
                        showConfirmPassword
                          ? 'Скрыть пароль'
                          : 'Показать пароль'
                      "
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <EyeOff v-if="showConfirmPassword" :size="15" />
                      <Eye v-else :size="15" />
                    </button>
                  </div>
                  <!-- Живой индикатор совпадения паролей.
                       Показывается только когда confirmPassword непустой. -->
                  <Transition name="auth-msg">
                    <span v-if="passwordsMatch" class="auth-hint auth-hint--ok"
                      >✓ Совпадает</span
                    >
                    <span
                      v-else-if="passwordMismatch"
                      class="auth-hint auth-hint--err"
                      >✗ Не совпадает</span
                    >
                  </Transition>
                </div>
              </div>

              <!-- Блок ошибки -->
              <Transition name="auth-msg">
                <p v-if="errorMessage" class="auth-error-msg">
                  {{ errorMessage }}
                </p>
              </Transition>

              <!-- Кнопка регистрации -->
              <button
                type="submit"
                class="auth-submit"
                :disabled="authStore.loading"
              >
                <span v-if="authStore.loading" class="auth-loading-dots">
                  <span></span><span></span><span></span>
                </span>
                <span v-else>Создать аккаунт</span>
              </button>
            </form>

            <!-- Подвал карточки -->
            <div class="auth-card-footer">
              <span>Уже есть аккаунт?</span>
              <router-link to="/login" class="auth-link">Войти</router-link>
            </div>
            <div class="auth-card-footer" style="margin-top: 0.5rem">
              <router-link to="/" class="auth-link-muted">
                Продолжить без аккаунта
              </router-link>
            </div>
          </div>
        </Transition>
      </div>
    </main>
  </div>
</template>

<!-- Только transition-анимации — специфика конкретных компонентов,
     не подходят для style.css как переиспользуемые классы. -->
<style scoped>
/* Появление/исчезновение сообщений (ошибка, индикатор паролей) */
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

/* Переход между формой и экраном успеха */
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
