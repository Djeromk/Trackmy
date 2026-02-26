export interface KinopoiskItem {
  kinopoiskId: number;
  imdbId: string;
  nameRu: string;
  nameEn: string;
  nameOriginal: string;
  countries: { countries: string }[];
  genres: { genre: string }[];
  ratingKinopoisk: number;
  ratingImdb: number;
  year: number;
  type: string;
  posterUrl: string;
  posterUrlPreview: string;
  isSeries: boolean;
}

export interface KinopoiskItemByID {
  kinopoiskId: number;
  kinopoiskHDId: string;
  imdbId: string;
  nameRu: string;
  nameEn: string;
  nameOriginal: string;
  posterUrl: string;
  posterUrlPreview: string;
  coverUrl: string;
  logoUrl: string;
  reviewsCount: number;
  ratingGoodReview: number;
  ratingGoodReviewVoteCount: number;
  ratingKinopoisk: number;
  ratingKinopoiskVoteCount: number;
  ratingImdb: number;
  ratingImdbVoteCount: number;
  ratingFilmCritics: number;
  ratingFilmCriticsVoteCount: number;
  ratingAwait: number;
  ratingAwaitCount: number;
  ratingRfCritics: number;
  ratingRfCriticsVoteCount: number;
  webUrl: string;
  year: number;
  filmLength: number;
  slogan: string;
  description: string;
  shortDescription: string;
  editorAnnotation: string;
  isTicketsAvailable: false;
  productionStatus: string;
  type: "FILM" | "TV_SHOW";
  ratingMpaa: string;
  ratingAgeLimits: string;
  hasImax: false;
  has3D: false;
  lastSync: string;
  countries: { country: string }[];
  genres: { genre: string }[];
  startYear: number;
  endYear: number;
  serial: boolean;
  shortFilm: boolean;
  completed: boolean;
}

export interface ExternalMovie {
  id: string;
  imdbId: string;
  nameRu: string;
  nameEn: string;
  nameOriginal: string;
  countries: { country: string }[];
  genres: { genre: string }[];
  ratingKinopoisk: number;
  ratingImdb: number;
  year: number;
  type: string;
  posterUrl: string;
  posterUrlPreview: string;
  thumbnail: string;
  isSeries: boolean;
}

export interface IAllKinopoiskResponse {
  data: ExternalMovie[] | null
  error: string | null
}
export interface IKinopoiskResponseById {
  data: KinopoiskItemByID | null
  error: string | null
}
