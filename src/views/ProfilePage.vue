<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader,
  BookOpen,
  Film,
  Gamepad2,
  ShieldCheck,
  LogOut,
} from 'lucide-vue-next'
import { useMediaStore } from '@/stores/media'

const router = useRouter()
const authStore = useAuthStore()
const mediaStore = useMediaStore()

// ─── Состояние формы имени ─────────────────────────────────────────────────
/**
 * nameValue — текущее значение поля "Имя" в форме.
 * Инициализируется из authStore.profile?.name или пустой строкой.
 */
const nameValue = ref(authStore.profile?.name ?? '')
const nameLoading = ref(false)
const nameSuccess = ref(false)
const nameError = ref<string | null>(null)

// ─── Состояние формы пароля ────────────────────────────────────────────────
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref<string | null>(null)

/**
 * logoutLoading — индикатор загрузки при выходе из аккаунта.
 */
const logoutLoading = ref(false)

// ─── Вычисляемые свойства ──────────────────────────────────────────────────

/**
 * userInitials — первые буквы имени пользователя для аватара.
 * "Иван Иванов" → "ИИ", "Алиса" → "АЛ", нет имени → "?"
 */
const userInitials = computed(() => {
  const name = authStore.profile?.name ?? authStore.userEmail
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

/**
 * passwordStrength — оценка надёжности нового пароля (0-4 уровня).
 * Критерии: длина ≥8, заглавные буквы, цифры, спецсимволы.
 */
const passwordStrength = computed(() => {
  const p = newPassword.value
  if (!p) return { level: 0, label: '', color: '' }

  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  const levels = [
    { level: 0, label: '', color: '' },
    { level: 1, label: 'Слабый', color: 'var(--error-500, #ef4444)' },
    { level: 2, label: 'Средний', color: 'var(--warning-500, #f59e0b)' },
    { level: 3, label: 'Хороший', color: 'var(--primary-500)' },
    { level: 4, label: 'Надёжный', color: 'var(--success-500, #22c55e)' },
  ]
  return levels[score]
})

/**
 * passwordsMatch — совпадение нового пароля и его подтверждения.
 * null — пользователь ещё не начал вводить подтверждение.
 */
const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return null
  return newPassword.value === confirmPassword.value
})

const stats = computed(() => mediaStore.stats)

// ─── Обработчики ──────────────────────────────────────────────────────────

/**
 * handleSaveName — сохраняет новое имя через authStore.updateProfile().
 */
async function handleSaveName() {
  nameError.value = null
  const trimmed = nameValue.value.trim()

  if (!trimmed) {
    nameError.value = 'Имя не может быть пустым'
    return
  }
  if (trimmed.length < 2) {
    nameError.value = 'Имя должно содержать минимум 2 символа'
    return
  }
  if (trimmed === authStore.profile?.name) {
    nameError.value = 'Имя не изменилось'
    return
  }

  nameLoading.value = true
  try {
    const result = await authStore.updateProfile({ name: trimmed })
    if (result.success) {
      nameSuccess.value = true
      setTimeout(() => (nameSuccess.value = false), 3000)
    } else {
      nameError.value = result.error ?? 'Не удалось сохранить имя'
    }
  } finally {
    nameLoading.value = false
  }
}

/**
 * handleChangePassword — меняет пароль через Supabase Auth updateUser().
 * Примечание: Supabase не требует старый пароль в API, но мы проверяем его
 * локально для UX — чтобы пользователь осознанно выполнял смену.
 */
async function handleChangePassword() {
  passwordError.value = null

  if (!currentPassword.value) {
    passwordError.value = 'Введите текущий пароль'
    return
  }
  if (newPassword.value.length < 6) {
    passwordError.value = 'Новый пароль должен быть не менее 6 символов'
    return
  }
  if (!passwordsMatch.value) {
    passwordError.value = 'Пароли не совпадают'
    return
  }
  if (currentPassword.value === newPassword.value) {
    passwordError.value = 'Новый пароль совпадает с текущим'
    return
  }

  passwordLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) {
      passwordError.value = error.message
    } else {
      passwordSuccess.value = true
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      setTimeout(() => (passwordSuccess.value = false), 4000)
    }
  } finally {
    passwordLoading.value = false
  }
}

/**
 * handleLogout — выход из аккаунта.
 * Перенесён из AppHeader: выход — действие управления аккаунтом,
 * логичнее размещать его на странице настроек профиля.
 */
async function handleLogout() {
  logoutLoading.value = true
  try {
    await authStore.signOut()
    router.push('/')
  } finally {
    logoutLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--background-body) p-6">
    <div class="max-w-2xl mx-auto">

      <!-- Кнопка назад -->
      <button
        @click="router.back()"
        class="btn-ghost flex items-center gap-2 mb-8"
      >
        <ArrowLeft :size="20" />
        <span>Назад</span>
      </button>

      <!-- ── Шапка профиля ───────────────────────────────────── -->
      <div class="card-padded mb-6 flex items-center gap-6">
        <div
          class="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 text-white text-2xl font-bold shadow-[var(--shadow-md)]"
          style="background: linear-gradient(135deg, var(--primary-500), var(--primary-700))"
        >
          {{ userInitials }}
        </div>

        <div class="flex-1 min-w-0">
          <h1 class="truncate">
            {{ authStore.profile?.name ?? 'Пользователь' }}
          </h1>
          <div class="flex items-center gap-2 mt-1 text-(--text-tertiary)">
            <Mail :size="14" />
            <span class="text-sm truncate">{{ authStore.userEmail }}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--primary-50) border border-(--primary-200) shrink-0">
          <ShieldCheck :size="14" class="text-(--primary-600)" />
          <span class="text-xs font-medium text-(--primary-700)">Аккаунт активен</span>
        </div>
      </div>

      <!-- ── Быстрая статистика ─────────────────────────────── -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card-padded text-center">
          <div class="flex justify-center mb-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--category-books-bg)">
              <BookOpen :size="16" class="text-white" />
            </div>
          </div>
          <div class="text-2xl font-bold text-(--text-primary)">{{ stats.books.total }}</div>
          <div class="text-xs text-(--text-tertiary) mt-0.5">Книг</div>
        </div>
        <div class="card-padded text-center">
          <div class="flex justify-center mb-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--category-movies-bg)">
              <Film :size="16" class="text-white" />
            </div>
          </div>
          <div class="text-2xl font-bold text-(--text-primary)">{{ stats.movies.total }}</div>
          <div class="text-xs text-(--text-tertiary) mt-0.5">Фильмов</div>
        </div>
        <div class="card-padded text-center">
          <div class="flex justify-center mb-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--category-games-bg)">
              <Gamepad2 :size="16" class="text-white" />
            </div>
          </div>
          <div class="text-2xl font-bold text-(--text-primary)">{{ stats.games.total }}</div>
          <div class="text-xs text-(--text-tertiary) mt-0.5">Игр</div>
        </div>
      </div>

      <!-- ── Редактирование имени ────────────────────────────── -->
      <div class="card-padded mb-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="icon-wrapper w-9 h-9 rounded-lg bg-(--primary-50)">
            <User :size="18" class="text-(--primary-600)" />
          </div>
          <div>
            <h3>Имя профиля</h3>
            <p class="text-xs text-(--text-tertiary)">Отображается в шапке сайта и профиле</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-(--text-secondary) mb-1.5">
              Отображаемое имя
            </label>
            <input
              v-model="nameValue"
              type="text"
              placeholder="Введите ваше имя"
              class="input"
              :class="{ 'ring-2 ring-(--primary-500) border-transparent': nameValue.length > 0 }"
              @keydown.enter="handleSaveName"
            />
          </div>

          <p v-if="nameError" class="text-sm" style="color: var(--error-500, #ef4444)">
            {{ nameError }}
          </p>

          <button
            @click="handleSaveName"
            :disabled="nameLoading"
            class="btn-primary px-5 py-2.5 flex items-center gap-2"
            :class="{ 'bg-green-500 hover:bg-green-600': nameSuccess }"
          >
            <Loader v-if="nameLoading" :size="16" class="animate-spin" />
            <Check v-else-if="nameSuccess" :size="16" />
            <User v-else :size="16" />
            <span>{{ nameSuccess ? 'Сохранено!' : nameLoading ? 'Сохранение...' : 'Сохранить имя' }}</span>
          </button>
        </div>
      </div>

      <!-- ── Смена пароля ────────────────────────────────────── -->
      <div class="card-padded mb-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="icon-wrapper w-9 h-9 rounded-lg bg-(--primary-50)">
            <Lock :size="18" class="text-(--primary-600)" />
          </div>
          <div>
            <h3>Смена пароля</h3>
            <p class="text-xs text-(--text-tertiary)">Минимум 6 символов</p>
          </div>
        </div>

        <Transition name="fade">
          <div
            v-if="passwordSuccess"
            class="mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
            style="background: var(--success-50, #f0fdf4); border: 1px solid var(--success-200, #bbf7d0)"
          >
            <Check :size="18" style="color: var(--success-600, #16a34a)" />
            <span class="text-sm font-medium" style="color: var(--success-700, #15803d)">
              Пароль успешно изменён!
            </span>
          </div>
        </Transition>

        <div class="space-y-4">
          <!-- Текущий пароль -->
          <div>
            <label class="block text-sm font-medium text-(--text-secondary) mb-1.5">
              Текущий пароль
            </label>
            <div class="relative">
              <input
                v-model="currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                placeholder="Введите текущий пароль"
                class="input pr-10"
              />
              <button
                type="button"
                @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
              >
                <EyeOff v-if="showCurrentPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <!-- Новый пароль -->
          <div>
            <label class="block text-sm font-medium text-(--text-secondary) mb-1.5">
              Новый пароль
            </label>
            <div class="relative">
              <input
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="Придумайте новый пароль"
                class="input pr-10"
              />
              <button
                type="button"
                @click="showNewPassword = !showNewPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
              >
                <EyeOff v-if="showNewPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>

            <!--
              Индикатор надёжности: 4 горизонтальные полоски.
              Цвет и количество закрашенных полосок = уровень надёжности.
            -->
            <div v-if="newPassword" class="mt-2">
              <div class="flex gap-1 mb-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-all duration-300"
                  :style="{
                    backgroundColor: i <= passwordStrength.level
                      ? passwordStrength.color
                      : 'var(--gray-200)'
                  }"
                />
              </div>
              <p class="text-xs" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.label }}
              </p>
            </div>
          </div>

          <!-- Подтверждение нового пароля -->
          <div>
            <label class="block text-sm font-medium text-(--text-secondary) mb-1.5">
              Повторите новый пароль
            </label>
            <div class="relative">
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Повторите новый пароль"
                class="input pr-10"
                :class="{
                  'ring-2 border-transparent': confirmPassword.length > 0,
                  'ring-green-400': passwordsMatch === true,
                  'ring-red-400': passwordsMatch === false,
                }"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
              >
                <EyeOff v-if="showConfirmPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <p
              v-if="passwordsMatch !== null"
              class="text-xs mt-1"
              :style="{
                color: passwordsMatch
                  ? 'var(--success-600, #16a34a)'
                  : 'var(--error-500, #ef4444)'
              }"
            >
              {{ passwordsMatch ? '✓ Пароли совпадают' : '✗ Пароли не совпадают' }}
            </p>
          </div>

          <p v-if="passwordError" class="text-sm" style="color: var(--error-500, #ef4444)">
            {{ passwordError }}
          </p>

          <button
            @click="handleChangePassword"
            :disabled="passwordLoading"
            class="btn-primary px-5 py-2.5 flex items-center gap-2"
          >
            <Loader v-if="passwordLoading" :size="16" class="animate-spin" />
            <Lock v-else :size="16" />
            <span>{{ passwordLoading ? 'Сохранение...' : 'Изменить пароль' }}</span>
          </button>
        </div>
      </div>

      <div class="card-padded">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-(--text-primary)">Выход из аккаунта</p>
            <p class="text-xs text-(--text-tertiary) mt-0.5">
              Вы будете перенаправлены на главную страницу
            </p>
          </div>
          <button
            @click="handleLogout"
            :disabled="logoutLoading"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-(--gray-300) text-(--text-secondary) text-sm font-medium hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader v-if="logoutLoading" :size="16" class="animate-spin" />
            <LogOut v-else :size="16" />
            <span>{{ logoutLoading ? 'Выход...' : 'Выйти' }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
