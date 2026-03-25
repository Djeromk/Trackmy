-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.books (
  id uuid NOT NULL,
  author text,
  pages integer,
  isbn text,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_id_fkey FOREIGN KEY (id) REFERENCES public.media_items(id)
);
CREATE TABLE public.games (
  id uuid NOT NULL,
  developer text,
  platform ARRAY,
  genre ARRAY,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_id_fkey FOREIGN KEY (id) REFERENCES public.media_items(id)
);
CREATE TABLE public.kinopoisk_base (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text DEFAULT ''::text,
  cover_url text DEFAULT ''::text,
  kinopoisk_id text DEFAULT ''::text,
  is_series boolean,
  premiere_ru text,
  year smallint,
  title_original text,
  CONSTRAINT kinopoisk_base_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type = ANY (ARRAY['movie'::text, 'book'::text, 'game'::text])),
  title text NOT NULL,
  cover_url text,
  external_id text,
  is_custom boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT media_items_pkey PRIMARY KEY (id),
  CONSTRAINT media_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.movies (
  id uuid NOT NULL,
  director text,
  duration_minutes integer,
  release_year integer,
  is_series boolean DEFAULT false,
  seasons_count integer,
  episodes_count integer,
  imdb real,
  kinopoisk real,
  CONSTRAINT movies_pkey PRIMARY KEY (id),
  CONSTRAINT movies_id_fkey FOREIGN KEY (id) REFERENCES public.media_items(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  media_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['completed'::text, 'dropped'::text, 'in_progress'::text, 'wishlist'::text, 'backlog'::text])),
  rating integer CHECK (rating >= 1 AND rating <= 10),
  review text,
  is_finished boolean DEFAULT false,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  current_page integer CHECK (current_page IS NULL OR current_page > 0),
  current_season integer CHECK (current_season IS NULL OR current_season > 0),
  current_episode integer CHECK (current_episode IS NULL OR current_episode > 0),
  hours_played numeric CHECK (hours_played IS NULL OR hours_played >= 0::numeric),
  watched_episodes jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_media_pkey PRIMARY KEY (id),
  CONSTRAINT user_media_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_media_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_items(id)
);
