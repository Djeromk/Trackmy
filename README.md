# 🎬 TRACKmy — Media Tracking Application

> Современное веб-приложение для отслеживания фильмов, сериалов, книг и игр с удобным интерфейсом и детальной статистикой

[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📋 Оглавление

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Архитектура приложения](#архитектура-приложения)
- [Бизнес-логика](#бизнес-логика)
- [Установка и запуск](#установка-и-запуск)
- [Структура проекта](#структура-проекта)
- [Переменные окружения](#переменные-окружения)
- [База данных](#база-данных)
- [Особенности реализации](#особенности-реализации)
- [Roadmap](#roadmap)
- [Лицензия](#лицензия)

---

## 🎯 О проекте

**TRACKmy** — это учебный проект полнофункционального веб-приложения для персонального трекинга медиа-контента. Приложение позволяет пользователям управлять своими списками фильмов, сериалов, книг и игр, отслеживать прогресс просмотра/чтения/прохождения, выставлять оценки и вести статистику.

### Цели проекта

- Изучение современного стека фронтенд-разработки (Vue 3 Composition API, TypeScript, Pinia)
- Работа с внешними API (Кинопоиск, Google Books, RAWG)
- Интеграция с Backend-as-a-Service (Supabase)
- Реализация сложной бизнес-логики и state management
- Построение масштабируемой архитектуры приложения
- Создание адаптивного и доступного пользовательского интерфейса

---

## ✨ Возможности

### 🎭 Управление медиа-контентом

- **Поиск медиа**: Интеграция с внешними API для поиска фильмов, книг и игр
- **Категоризация**: Разделение контента по типам (фильмы/сериалы, книги, игры)
- **Статусы**: Гибкая система статусов (бэклог, в процессе, завершено, брошено)
- **Рейтинги**: Выставление персональных оценок (звёздная система 1-5)

### 📊 Отслеживание прогресса

- **Сериалы**: Постраничное отслеживание сезонов и эпизодов с чекбоксами
- **Книги**: Слайдер текущей страницы с автосохранением
- **Фильмы**: Информация о рейтингах Кинопоиск и IMDB
- **Игры**: Интеграция с Metacritic для объективной оценки

### 📈 Аналитика и статистика

- **Dashboard**: Визуализация общего прогресса через ECharts
- **Категорийная статистика**: Детальная разбивка по типам медиа
- **Недельная активность**: Отслеживание завершённых элементов за неделю
- **Прогресс-индикаторы**: Процент завершения по каждой категории

### 👤 Система аутентификации

- **Email/Password**: Стандартная регистрация через Supabase Auth
- **Демо-режим**: Анонимный вход для тестирования функционала
- **Профиль пользователя**: Управление именем и паролем
- **Восстановление пароля**: Email-based password reset flow

### 🎨 UI/UX

- **Тёмная/Светлая темы**: Автоматическое определение системной темы
- **Адаптивный дизайн**: Оптимизация для мобильных устройств
- **Skeleton loaders**: Плавная загрузка контента
- **Transitions**: Анимации переходов между состояниями
- **Error boundaries**: Graceful handling ошибок

---

## 🛠 Технологический стек

### Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Vue 3** | 3.5+ | Прогрессивный JavaScript-фреймворк с Composition API |
| **TypeScript** | 5.6+ | Статическая типизация для повышения надёжности кода |
| **Vite** | 5.4+ | Быстрый сборщик и dev-сервер нового поколения |
| **Pinia** | 2.2+ | Официальный state management для Vue 3 |
| **Vue Router** | 4.4+ | Официальный роутер с поддержкой TypeScript |
| **Tailwind CSS** | 3.4+ | Utility-first CSS-фреймворк (через UnoCSS) |

### Backend & Services

| Сервис | Назначение |
|--------|------------|
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, Storage) |
| **Кинопоиск API** | Данные о фильмах и сериалах (неофициальное API) |
| **Google Books API** | Информация о книгах |
| **RAWG API** | База данных видеоигр |

### Библиотеки

| Библиотека | Назначение |
|-----------|------------|
| **ECharts** | Визуализация статистики (кольцевые диаграммы) |
| **Lucide Vue** | Набор SVG-иконок |
| **@supabase/supabase-js** | Клиент для работы с Supabase |

---

## 🏗 Архитектура приложения

### Структура директорий

```
src/
├── assets/              # Статические ресурсы (шрифты, иконки, изображения)
│   └── fonts/           # Geist Mono, Syne, Epilogue
├── components/          # Vue-компоненты
│   ├── accordion/       # Аккордеон списков медиа
│   ├── dashboard/       # Компоненты главной страницы
│   ├── error/           # Error Boundary и NotFound
│   ├── layout/          # Header, Footer, Logo, ThemeToggle
│   ├── media/           # Компоненты страниц медиа (Poster, Rating, Status)
│   ├── search/          # Модальное окно поиска и утилиты
│   ├── series/          # Отслеживание прогресса сериалов
│   ├── skeleton/        # Skeleton loaders
│   ├── slider/          # Слайдер для книг (текущая страница)
│   └── tag/             # Компонент тега (жанры, категории)
├── composables/         # Переиспользуемая композиционная логика
│   ├── useTheme.ts      # Управление темой (light/dark/system)
│   └── useNotFound.ts   # Обработка 404 ошибок
├── router/              # Vue Router конфигурация
│   └── index.ts         # Определение маршрутов и guards
├── services/            # Слой работы с внешними сервисами
│   ├── api/             # Клиенты внешних API
│   │   ├── kinopoisk.ts # Кинопоиск API
│   │   ├── google-books.ts # Google Books API
│   │   └── games.ts     # RAWG API
│   ├── supabase.ts      # Supabase клиент и db-методы
│   └── mediaService.ts  # Бизнес-логика работы с медиа
├── stores/              # Pinia stores (глобальное состояние)
│   ├── auth.ts          # Аутентификация и профиль пользователя
│   └── media.ts         # Управление медиа-контентом пользователя
├── styles/              # Глобальные стили
│   ├── style.css        # Основные стили и CSS-переменные
│   ├── variables.css    # CSS-переменные для тем и цветов
│   └── fonts.css        # @font-face определения
├── types/               # TypeScript типы и интерфейсы
│   ├── index.ts         # Общие типы (MediaType, MediaStatus, UserMedia)
│   ├── movie.ts         # Типы для фильмов (Кинопоиск API)
│   ├── book.ts          # Типы для книг (Google Books API)
│   ├── game.ts          # Типы для игр (RAWG API)
│   └── series.ts        # Типы для отслеживания сериалов
├── utils/               # Утилитарные функции
│   ├── utils.ts         # Общие хелперы
│   └── seriesProgress.ts # Логика расчёта прогресса сериалов
├── views/               # Страницы (компоненты маршрутов)
│   ├── Dashboard.vue    # Главная страница с карточками категорий
│   ├── BookPage.vue     # Детальная страница книги
│   ├── MoviePage.vue    # Детальная страница фильма/сериала
│   ├── GamePage.vue     # Детальная страница игры
│   ├── ProfilePage.vue  # Страница профиля пользователя
│   └── {auth}/          # Страницы аутентификации
│       ├── Login.vue
│       ├── Register.vue
│       └── ResetPassword.vue
├── App.vue              # Корневой компонент
├── AppWrapper.vue       # Обёртка с Suspense для async setup
└── main.ts              # Точка входа приложения
```

### Паттерны и подходы

#### 1. **Composition API**
Все компоненты используют `<script setup>` синтаксис для компактности и лучшей типизации:

```typescript
// Чёткая типизация props и emits
interface Props {
  title: string;
  items: UserMedia[];
}

interface Emits {
  (e: "update-status", id: string, status: MediaStatus): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
```

#### 2. **Централизованное управление состоянием (Pinia)**

**authStore** (`stores/auth.ts`):
- Управление сессией пользователя
- Загрузка профиля из таблицы `profiles`
- Методы sign-in/sign-up/sign-out
- Computed-свойства для UI (isDemoUser, userEmail, userName)

**mediaStore** (`stores/media.ts`):
- CRUD операции с медиа-контентом
- Автоматический расчёт статистики через computed
- Оптимистичные обновления UI
- Интеграция с mediaService для работы с БД

#### 3. **Слой сервисов (Service Layer)**

**Зачем нужен**: Разделение ответственности — компоненты отвечают за UI, stores за state, services за бизнес-логику.

```typescript
// services/mediaService.ts
export const mediaService = {
  async createMediaFromExternal(params) {
    // 1. Проверка существования медиа в БД (getMediaByExternalId)
    // 2. Создание нового медиа если не найдено (createMediaItem)
    // 3. Создание type-specific данных (createMovie/createBook/createGame)
    // 4. Добавление в список пользователя (addUserMedia)
  }
}
```

#### 4. **Типизация без any/unknown**

Все типы строго определены в `src/types/`:

```typescript
// types/index.ts
export type MediaType = "movie" | "book" | "game" | "other";
export type MediaStatus = "completed" | "dropped" | "in_progress" | "backlog";

export interface UserMedia {
  id: string;
  userId: string;
  mediaId: string;
  status: MediaStatus;
  rating: number | null;
  review: string | null;
  // ... детальная типизация каждого поля
  media?: MediaItem; // JOIN с таблицей media_items
}
```

#### 5. **Composables для переиспользуемой логики**

```typescript
// composables/useTheme.ts
export function useTheme() {
  const preference = ref<ThemePreference>('system');

  function isDark(): boolean {
    return resolveTheme(preference.value) === 'dark';
  }

  function toggleTheme(): void {
    setTheme(isDark() ? 'light' : 'dark');
  }

  return { preference, isDark, setTheme, toggleTheme };
}
```

---

## 🧠 Бизнес-логика

### 1. Добавление медиа в коллекцию

**Сценарий**: Пользователь находит фильм через поиск и добавляет его в список "В процессе"

**Flow**:

```
[SearchModal] Пользователь вводит название
    ↓
[kinopoiskService.searchMovies()] API запрос к Кинопоиску
    ↓
[SearchModal] Отображение результатов с кнопкой "Добавить"
    ↓
[handleMediaSelect()] Клик по статусу → emit('select', item, status)
    ↓
[Dashboard] Обработка события → mediaStore.addMediaFromExternal()
    ↓
[mediaService.createMediaFromExternal()]
    ├─> db.getMediaByExternalId() — Проверка существования
    ├─> db.createMediaItem() — Создание записи в media_items
    ├─> db.createMovie() — Создание type-specific данных
    └─> db.addUserMedia() — Связывание с пользователем
    ↓
[mediaStore.fetchUserMedia()] Обновление локального состояния
    ↓
[UI Update] Фильм появляется в списке и статистике
```

**Ключевые особенности**:
- Дедупликация по `external_id` — если фильм уже есть в БД, повторно не создаётся
- Транзакционность — если любой шаг падает, вся операция откатывается
- Оптимистичные обновления — UI обновляется мгновенно, синхронизация с БД в фоне

### 2. Отслеживание прогресса сериалов

**Сценарий**: Пользователь отмечает просмотренные эпизоды сериала

**Структура данных**:

```typescript
// user_media.watched_episodes — JSONB поле
{
  "1": [1, 2, 3, 4],    // Сезон 1: просмотрены эпизоды 1-4
  "2": [1, 2],          // Сезон 2: просмотрены эпизоды 1-2
  "3": []               // Сезон 3: не начат
}
```

**Алгоритм расчёта прогресса** (`utils/seriesProgress.ts`):

```typescript
export function calculateSeriesProgress(
  seasons: KinopoiskTVSeason[],
  watchedEpisodes: WatchedEpisodesMap
): SeriesProgress {
  // 1. Для каждого сезона считаем просмотренные эпизоды
  const seasonProgress = seasons.map(season => {
    const watched = watchedEpisodes[season.number.toString()] || [];
    return {
      seasonNumber: season.number,
      totalEpisodes: season.episodes.length,
      watchedCount: watched.length,
      completionPercentage: Math.round((watched.length / season.episodes.length) * 100)
    };
  });

  // 2. Суммируем общий прогресс
  const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
  const watchedCount = seasonProgress.reduce((sum, s) => sum + s.watchedCount, 0);

  // 3. Находим первую непросмотренную серию (current_season, current_episode)
  const current = findCurrentEpisode(seasons, watchedEpisodes);

  return {
    totalSeasons: seasons.length,
    totalEpisodes,
    watchedEpisodes: watchedCount,
    completionPercentage: Math.round((watchedCount / totalEpisodes) * 100),
    current_season: current.season,
    current_episode: current.episode,
    seasons: seasonProgress
  };
}
```

**Оптимизации**:
- Оптимистичное обновление UI — чекбокс меняет состояние мгновенно
- Debounced синхронизация с БД — не отправляем запрос при каждом клике
- Автоматический расчёт `current_season`/`current_episode` при каждом обновлении

### 3. Управление статусами

**Бизнес-правила**:

```typescript
// Автоматические триггеры при смене статуса
const createStatusUpdatePayload = (status: MediaStatus) => ({
  status,
  is_finished: status === "completed" || status === "dropped",
  completed_at: status === "completed" ? new Date().toISOString() : null,
  // Если статус "завершено" — фиксируем дату
});
```

**Workflow**:

1. **Бэклог → В процессе**:
   - `started_at` устанавливается в текущую дату
   - Элемент появляется в секции "Сейчас в процессе" на главной

2. **В процессе → Завершено**:
   - `completed_at` = текущая дата
   - `is_finished` = true
   - Обновляется статистика "Завершено за неделю"
   - Для сериалов: автоматически помечаются все эпизоды как просмотренные

3. **Любой → Брошено**:
   - `is_finished` = true
   - Элемент скрывается из "В процессе"
   - Статистика обновляется (не считается в "Завершено")

### 4. Статистика и аналитика

**Расчёт метрик** (`stores/media.ts`):

```typescript
const stats = computed<DashboardStats>(() => {
  const calculateStats = (type: MediaType) => {
    const items = userMedia.value.filter(m => m.media?.type === type);
    return {
      total: items.length,
      completed: items.filter(m => m.status === 'completed').length,
      inProgress: items.filter(m => m.status === 'in_progress').length,
      backlog: items.filter(m => m.status === 'backlog').length,
      dropped: items.filter(m => m.status === 'dropped').length,
    };
  };

  return {
    movies: calculateStats('movie'),
    books: calculateStats('book'),
    games: calculateStats('game'),
    overall: {
      totalItems: userMedia.value.length,
      completedItems: userMedia.value.filter(m => m.status === 'completed').length,
    }
  };
});
```

**Недельная активность**:

```typescript
const thisWeekCompleted = computed<number>(() => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 6); // Последние 7 дней
  const weekAgoMs = weekAgo.getTime();

  return mediaStore.userMedia.filter((item: UserMedia) => {
    if (item.status !== 'completed') return false;
    const completedMs = new Date(item.completed_at ?? item.updatedAt).getTime();
    return completedMs >= weekAgoMs;
  }).length;
});
```

### 5. Аутентификация и сессии

**Supabase Auth Flow**:

```typescript
// stores/auth.ts
async function initialize() {
  // 1. Восстановление сессии из localStorage
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    user.value = {
      id: session.user.id,
      email: session.user.email,
      createdAt: session.user.created_at,
      isAnonymous: session.user.is_anonymous === true
    };

    // 2. Загрузка профиля из таблицы profiles
    await loadProfile(session.user.id);
  }

  // 3. Подписка на изменения auth состояния
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      await setUserFromSession(session.user);
    } else {
      user.value = null;
      profile.value = null;
    }
  });
}
```

**Route Guards** (`router/index.ts`):

```typescript
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth as boolean;
  const guestOnly = to.meta.guestOnly as boolean;

  // Инициализация auth при первом запуске
  if (!authStore.isAuthenticated) {
    await authStore.initialize();
  }

  // Защита приватных роутов
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  }
  // Редирект с auth-страниц если уже залогинен
  else if (guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' });
  }
  else {
    next();
  }
});
```

**Демо-режим** (анонимный вход):

```typescript
async function signInAnonymously(): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (!error && data.user) {
    await setUserFromSession(data.user);
    // Анонимные пользователи получают временную сессию
    // Данные сохраняются в БД но привязаны к временному UUID
  }

  return { success: !error };
}
```

---

## 🚀 Установка и запуск

### Предварительные требования

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0 или **pnpm** ≥ 8.0.0
- **Supabase Account** (для backend)
- **API Keys**: Кинопоиск, Google Books, RAWG

### Шаги установки

1. **Клонирование репозитория**

```bash
git clone https://github.com/yourusername/trackmy-media.git
cd trackmy-media
```

2. **Установка зависимостей**

```bash
npm install
# или
pnpm install
```

3. **Настройка переменных окружения**

Создайте файл `.env` в корне проекта:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# External APIs
VITE_KINOPOISK_API_KEY=your-kinopoisk-key
VITE_GOOGLE_BOOKS_API_KEY=your-google-books-key
VITE_RAWG_API_KEY=your-rawg-key
```

4. **Настройка базы данных Supabase**

Выполните SQL-миграции из `database/schema.sql` (см. раздел [База данных](#база-данных))

5. **Запуск dev-сервера**

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Production build

```bash
npm run build
npm run preview  # Предпросмотр production-сборки
```

---

## 📁 Структура проекта

### Ключевые директории

#### `/src/components/`
Переиспользуемые Vue-компоненты, организованные по функциональным модулям

#### `/src/stores/`
Pinia stores для глобального состояния:
- **auth.ts**: Управление аутентификацией
- **media.ts**: CRUD операции с медиа-контентом

#### `/src/services/`
Слой интеграций с внешними сервисами:
- **api/**: Клиенты для внешних API
- **supabase.ts**: Обёртка над Supabase клиентом
- **mediaService.ts**: Бизнес-логика добавления медиа

#### `/src/types/`
TypeScript определения типов для:
- Доменных моделей (UserMedia, MediaItem)
- API ответов (Кинопоиск, Google Books, RAWG)
- Internal state и props/emits интерфейсов

#### `/src/views/`
Страницы-роуты приложения:
- Dashboard — главная страница с карточками категорий
- MoviePage/BookPage/GamePage — детальные страницы медиа
- ProfilePage — управление профилем
- {auth}/ — страницы аутентификации

---

## 🔐 Переменные окружения

### Обязательные переменные

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `VITE_SUPABASE_URL` | URL вашего Supabase проекта | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Публичный anon key | `eyJhbGci...` |
| `VITE_KINOPOISK_API_KEY` | API ключ Кинопоиска (неофициальное API) | `xxxxx-xxxxx-xxxxx` |
| `VITE_GOOGLE_BOOKS_API_KEY` | Google Books API v1 key | `AIzaSyXxx...` |
| `VITE_RAWG_API_KEY` | RAWG Video Games Database API key | `xxxxx...` |

### Получение API ключей

**Supabase**:
1. Создайте проект на [supabase.com](https://supabase.com)
2. Settings → API → Project URL и anon public key

**Кинопоиск API**:
- Используется неофициальное API: [kinopoiskapiunofficial.tech](https://kinopoiskapiunofficial.tech/)
- Регистрация → получение токена

**Google Books**:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Books API
3. Credentials → Create API Key

**RAWG**:
1. [RAWG.io](https://rawg.io/apidocs)
2. Get API Key (бесплатно)

---

## 🗄 База данных

### Схема Supabase

Приложение использует следующие таблицы:

#### **1. `profiles`** — Профили пользователей

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Назначение**: Дополнительная информация о пользователе (имя, аватар). Связана с `auth.users` через Foreign Key.

#### **2. `media_items`** — Каталог всех медиа

```sql
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('movie', 'book', 'game', 'other')),
  title TEXT NOT NULL,
  cover_url TEXT,
  external_id TEXT,  -- ID из внешнего API (kinopoisk_id, google_books_id, rawg_id)
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(external_id, type)  -- Предотвращает дубликаты из внешних API
);

CREATE INDEX idx_media_items_external_id ON media_items(external_id);
CREATE INDEX idx_media_items_type ON media_items(type);
```

**Назначение**: Центральный каталог медиа-контента. Один элемент может быть у нескольких пользователей (через `user_media`).

#### **3. Type-specific таблицы**

```sql
-- Детальная информация о фильмах/сериалах
CREATE TABLE movies (
  id UUID PRIMARY KEY REFERENCES media_items(id) ON DELETE CASCADE,
  release_year INTEGER,
  is_series BOOLEAN DEFAULT false
);

-- Детальная информация о книгах
CREATE TABLE books (
  id UUID PRIMARY KEY REFERENCES media_items(id) ON DELETE CASCADE,
  author TEXT,
  pages INTEGER,
  isbn TEXT
);

-- Детальная информация об играх
CREATE TABLE games (
  id UUID PRIMARY KEY REFERENCES media_items(id) ON DELETE CASCADE,
  platform TEXT[],
  genre TEXT[]
);
```

**Назначение**: Специфичные для типа медиа поля. Связаны с `media_items` через Foreign Key.

#### **4. `user_media`** — Связь пользователей с медиа

```sql
CREATE TABLE user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'in_progress', 'completed', 'dropped')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_finished BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Прогресс для книг
  current_page INTEGER,

  -- Прогресс для сериалов
  current_season INTEGER,
  current_episode INTEGER,
  watched_episodes JSONB DEFAULT '{}'::jsonb,  -- {"1": [1,2,3], "2": [1]}

  -- Прогресс для игр
  hours_played INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, media_id)  -- Пользователь не может добавить один фильм дважды
);

CREATE INDEX idx_user_media_user_id ON user_media(user_id);
CREATE INDEX idx_user_media_status ON user_media(status);
CREATE INDEX idx_user_media_completed ON user_media(completed_at) WHERE status = 'completed';
```

**Назначение**: "Many-to-Many" связь между пользователями и медиа с дополнительными полями (статус, рейтинг, прогресс).

### Row Level Security (RLS)

Supabase использует RLS для защиты данных на уровне БД:

```sql
-- Пользователи видят только свои записи
CREATE POLICY "Users can read own media"
  ON user_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON user_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON user_media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON user_media FOR DELETE
  USING (auth.uid() = user_id);
```

### Миграции

Создайте таблицы через Supabase SQL Editor или используйте файл `database/schema.sql` из репозитория.

---

## 🎨 Особенности реализации

### 1. Оптимизация производительности

#### **Ленивая загрузка изображений**

```html
<img :src="coverUrl" loading="lazy" @error="handleImageError" />
```

- `loading="lazy"` — нативная браузерная оптимизация
- Fallback на SVG при ошибке загрузки

#### **Debounced поиск**

```typescript
// SearchModal.vue
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    performSearch(newQuery);
  }, 1000); // Запрос отправляется через 1 сек после прекращения ввода
});
```

#### **Intersection Observer для видимости**

```typescript
// AccordionSection.vue - загрузка контента только при скролле к нему
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    isVisible.value = true;
    observer?.disconnect();
  }
}, { threshold: 0.5, rootMargin: '100px' });
```

### 2. UX-решения

#### **Оптимистичные обновления**

```typescript
// stores/media.ts
async function updateMedia(id: string, updates: Partial<UserMedia>) {
  // 1. Сразу обновляем UI
  const itemIndex = userMedia.value.findIndex(item => item.id === id);
  const previousState = { ...userMedia.value[itemIndex] };
  userMedia.value[itemIndex] = { ...userMedia.value[itemIndex], ...updates };

  try {
    // 2. Отправляем в БД
    const { error } = await db.updateUserMedia(id, updates);
    if (error) throw error;
  } catch (e) {
    // 3. Откатываем при ошибке
    userMedia.value[itemIndex] = previousState;
  }
}
```

**Результат**: UI реагирует мгновенно, даже при медленном интернете.

#### **Skeleton loaders вместо спиннеров**

```vue
<!-- SkeletonLoader.vue -->
<div class="skeleton-card animate-pulse">
  <div class="skeleton-title"></div>
  <div class="skeleton-subtitle"></div>
</div>
```

**Преимущество**: Пользователь видит макет страницы до загрузки данных, снижается perceived loading time.

#### **Smart фильтрация через v-show**

```vue
<!-- MediaListItem.vue -->
<div
  v-for="item in items"
  :key="item.id"
  v-show="activeFilter === 'all' || item.media?.type === activeFilter"
>
  <img :src="item.coverUrl" />  <!-- Не перезагружается при смене фильтра -->
</div>
```

**Почему v-show, а не v-if**: Изображения остаются в DOM и в кэше браузера, не происходит повторная загрузка при переключении табов.

### 3. Accessibility (a11y)

#### **Семантический HTML**

```html
<button
  @click="toggleDropdown"
  :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
  :aria-expanded="isOpen"
>
```

#### **Keyboard navigation**

```typescript
// SearchModal.vue
@keydown.down.prevent="moveFocus(1)"   // Arrow Down
@keydown.up.prevent="moveFocus(-1)"    // Arrow Up
@keydown.enter="selectItem()"          // Enter
@keydown.esc="closeModal()"            // Escape
```

#### **Focus management**

```vue
<input ref="inputRef" v-focus autofocus />

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
}
```

### 4. Error handling

#### **Error Boundary для React-like обработки ошибок**

```vue
<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err: Error, instance, info: string): false => {
  error.value = err
  console.error('[ErrorBoundary] Caught:', err, info)
  return false // Предотвращаем всплытие
})
</script>

<template>
  <slot v-if="!error" />
  <div v-else class="error-fallback">
    <h3>Что-то пошло не так</h3>
    <button @click="error = null">Попробовать снова</button>
  </div>
</template>
```

**Использование**:

```vue
<ErrorBoundary>
  <Suspense>
    <AppWrapper />
  </Suspense>
</ErrorBoundary>
```

#### **Not Found handling через composable**

```typescript
// composables/useNotFound.ts
export function useNotFound() {
  const router = useRouter()

  function redirectToNotFound(): void {
    router.replace({ name: 'not-found' }) // replace вместо push
  }

  function isNotFoundError(error: unknown): boolean {
    return error?.message?.includes('404') ||
           error?.message?.includes('not found')
  }

  return { redirectToNotFound, isNotFoundError }
}
```

**Использование в компонентах**:

```typescript
// MoviePage.vue
const { redirectToNotFound, isNotFoundError } = useNotFound()

onMounted(async () => {
  try {
    movie.value = await kinopoiskService.searchMovieByID(movieId)
  } catch (e) {
    if (isNotFoundError(e)) {
      redirectToNotFound()  // Программный редирект на 404
      return
    }
    error.value = 'Не удалось загрузить фильм'
  }
})
```

### 5. Theme система

#### **Multi-mode theme support**

```typescript
// composables/useTheme.ts
type ThemePreference = 'light' | 'dark' | 'system'

function useTheme() {
  const preference = ref<ThemePreference>(
    localStorage.getItem('theme-preference') ?? 'system'
  )

  function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
    return pref === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : pref
  }

  function applyTheme(pref: ThemePreference): void {
    const resolved = resolveTheme(pref)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }

  // Слушаем изменения системной темы
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (preference.value === 'system') applyTheme('system')
    })
}
```

#### **CSS Variables для тем**

```css
/* styles/variables.css */
:root {
  --primary-500: #d87943;
  --background-body: #f9fafb;
  --text-primary: #111827;
  /* ... */
}

.dark {
  --primary-500: #e78a53;
  --background-body: #0e0e0f;
  --text-primary: #e8e8e8;
  /* ... */
}
```

**Использование в компонентах**:

```html
<div class="bg-(--background-body) text-(--text-primary)">
  <!-- UnoCSS автоматически подставляет var(--background-body) -->
</div>
```

---

## 🗺 Roadmap

### В разработке

- [ ] **Social features**: Шаринг списков с друзьями
- [ ] **Комментарии**: Добавление заметок к медиа
- [ ] **Теги**: Кастомная категоризация (жанры, настроение)
- [ ] **Статистика**: Расширенная аналитика (графики, тренды)

### Технические улучшения

- [ ] **i18n**: Мультиязычность (EN, RU)
- [ ] **E2E тесты**: Playwright для критических флоу
- [ ] **Performance**: Virtual scrolling для больших списков

---

## 📄 Лицензия

Этот проект создан в образовательных целях и распространяется под лицензией **MIT**.

```
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Контакты

**Автор**: Алексей Сурков
**Email**: adimisug@example.com
**GitHub**: [@Djerom_k](https://github.com/Djerom_k)
**Telegram**: [@adsurs](https://t.me/adsurs)

---

<p align="center">
  Сделано для изучения Vue 3 и современной фронтенд-разработки
</p>
