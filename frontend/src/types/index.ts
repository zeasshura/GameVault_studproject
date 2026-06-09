// ============================================================
// Типы и интерфейсы TypeScript для GameVault
// ============================================================

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  bio?: string;
  avatar_url?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Platform {
  id: number;
  name: string;
}

export interface Game {
  id: number;
  title: string;
  description: string;
  release_date: string | null;
  cover_url: string | null;
  video_url?: string | null;
  avg_rating: number;
  genres: Genre[];
  platforms: Platform[];
  rawg_id?: number | null;
}

export interface Review {
  id: number;
  user: User;
  game: number;
  text: string;
  score: number;
  score_gameplay: number;
  score_story: number;
  score_graphics: number;
  score_sound: number;
  created_at: string;
}

export interface Collection {
  id: number;
  user: number;
  name: string;
  games: Game[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

export interface GameFilters {
  search?: string;
  genre?: number | string;
  platform?: number | string;
  year_from?: number | string;
  year_to?: number | string;
  min_rating?: number | string;
  ordering?: string;
  page?: number;
}

export interface RawgGame {
  rawg_id: number;
  title: string;
  release_date: string | null;
  cover_url: string | null;
  video_url?: string | null;
  avg_rating: number;
  genres: string[];
  platforms: string[];
}

export interface ImportReport {
  success_count: number;
  error_count: number;
  errors: string[];
}

export interface GameFormData {
  title: string;
  description: string;
  release_date: string;
  cover_url: string;
  genres: number[];
  platforms: number[];
}
