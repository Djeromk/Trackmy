<script setup lang="ts">
import { useRouter } from 'vue-router'
import { BookOpen, Film, Gamepad2, LaptopMinimalCheck } from 'lucide-vue-next'

const router = useRouter()

function handleStart() {
  router.push('/register')
}

function handleDemo() {
  router.push('/login')
}
</script>

<template>
  <section class="cta-section mb-10" aria-label="Добро пожаловать">
    <!-- Фоновая сетка -->
    <div class="cta-grid" aria-hidden="true"></div>

    <div class="cta-inner">
      <!-- Левая часть: текст -->
      <div class="cta-content">
        <!-- Eyebrow -->
        <div class="cta-eyebrow">
          <LaptopMinimalCheck :size="12" />
          <span>Персональный медиа-трекер</span>
        </div>

        <!-- Заголовок -->
        <h1 class="cta-title">
          Всё что смотришь,<br />
          читаешь и играешь —<br />
          <span class="cta-title-accent">в одном месте</span>
        </h1>

        <!-- Описание -->
        <p class="cta-description">
          TRACKmy — современное приложение для отслеживания фильмов, сериалов,
          книг и игр. Управляй списками, выставляй оценки, следи за прогрессом
          и смотри подробную статистику по каждой категории.
        </p>

        <!-- Кнопки -->
        <div class="cta-actions">
          <button @click="handleStart" class="cta-btn-primary">
            Начать отслеживать
          </button>
          <button @click="handleDemo" class="btn-secondary px-5 py-2.5 text-sm">
            Уже есть аккаунт
          </button>
        </div>
      </div>

      <!-- Правая часть: карточки категорий -->
      <div class="cta-cards" aria-hidden="true">
        <div class="cta-card cta-card--movies">
          <div class="cta-card-icon">
            <Film :size="18" />
          </div>
          <div class="cta-card-body">
            <span class="cta-card-label">Фильмы и Сериалы</span>
            <span class="cta-card-sub">Оценки KP и IMDB</span>
          </div>
          <div class="cta-card-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="cta-card cta-card--books">
          <div class="cta-card-icon">
            <BookOpen :size="18" />
          </div>
          <div class="cta-card-body">
            <span class="cta-card-label">Книги</span>
            <span class="cta-card-sub">Прогресс по страницам</span>
          </div>
          <div class="cta-card-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="cta-card cta-card--games">
          <div class="cta-card-icon">
            <Gamepad2 :size="18" />
          </div>
          <div class="cta-card-body">
            <span class="cta-card-label">Игры</span>
            <span class="cta-card-sub">Metacritic и рейтинги</span>
          </div>
          <div class="cta-card-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-section {
  position: relative;
  border-radius: var(--border-radius-xl);
  border: var(--border-width) solid var(--border-color);
  background-color: var(--background-card);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

/* Сетка-фон */
.cta-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border-color-subtle) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-color-subtle) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.6;
  pointer-events: none;
}

/* Внутренний контейнер */
.cta-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 2.5rem;
}

@media (min-width: 768px) {
  .cta-inner {
    flex-direction: row;
    align-items: center;
    gap: 3rem;
    padding: 3rem 3rem;
  }
}

/* Левая часть */
.cta-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Eyebrow */
.cta-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--border-radius-full);
  background-color: var(--primary-50);
  border: 1px solid var(--primary-100);
  color: var(--primary-500);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  width: fit-content;
}

.dark .cta-eyebrow {
  background-color: var(--primary-100);
  border-color: var(--primary-200);
  color: var(--primary-500);
}

/* Заголовок */
.cta-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-extrabold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin: 0;
}

@media (min-width: 768px) {
  .cta-title {
    font-size: var(--text-4xl);
  }
}

.cta-title-accent {
  color: var(--primary-500);
}

/* Описание */
.cta-description {
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-tertiary);
  max-width: 42ch;
  margin: 0;
}

/* Кнопки */
.cta-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.cta-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border-radius: var(--border-radius-base);
  background-color: var(--primary-500);
  color: var(--text-inverse);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-base), transform var(--transition-fast), box-shadow var(--transition-base);
}

.cta-btn-primary:hover {
  background-color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.cta-btn-primary:active {
  background-color: var(--primary-700);
  transform: translateY(0);
}

/* Правая часть: карточки */
.cta-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  width: 100%;
}

@media (min-width: 768px) {
  .cta-cards {
    width: 260px;
  }
}

.cta-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background-color: var(--background-elevated);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.cta-card:hover {
  transform: translateX(3px);
  box-shadow: var(--shadow-sm);
}

/* Иконки категорий */
.cta-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-sm);
  flex-shrink: 0;
  color: #fff;
}

.cta-card--movies .cta-card-icon {
  background-color: var(--category-movies-bg);
}

.cta-card--books .cta-card-icon {
  background-color: var(--category-books-bg);
}

.cta-card--games .cta-card-icon {
  background-color: var(--category-games-bg);
}

/* Текст карточки */
.cta-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.cta-card-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cta-card-sub {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* Декоративные точки */
.cta-card-dots {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.cta-card-dots span {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--border-color-strong);
}

.cta-card--movies .cta-card-dots span:first-child {
  background-color: var(--category-movies-bg);
  opacity: 0.7;
}

.cta-card--books .cta-card-dots span:first-child {
  background-color: var(--category-books-bg);
  opacity: 0.7;
}

.cta-card--games .cta-card-dots span:first-child {
  background-color: var(--category-games-bg);
  opacity: 0.7;
}
</style>
