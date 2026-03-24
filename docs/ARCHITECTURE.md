# Архитектура

## Структура директорий

``` bash
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

## Паттерны и подходы

### 1. **Composition API**

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

### 2. **Централизованное управление состоянием (Pinia)**

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

### 3. **Слой сервисов (Service Layer)**

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

### 4. **Типизация без any/unknown**

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

### 5. **Composables для переиспользуемой логики**

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
