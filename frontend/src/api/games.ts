import apiClient from './client';
import type {
  Game,
  Genre,
  Platform,
  PaginatedResponse,
  GameFilters,
  GameFormData,
  RawgGame,
  ImportReport,
} from '../types';

export const gamesApi = {
  getGames: async (params?: GameFilters): Promise<PaginatedResponse<Game>> => {
    const response = await apiClient.get<PaginatedResponse<Game>>('/games/', { params });
    return response.data;
  },

  getGame: async (id: number | string): Promise<Game> => {
    const response = await apiClient.get<Game>(`/games/${id}/`);
    return response.data;
  },

  createGame: async (data: GameFormData): Promise<Game> => {
    const payload = {
      ...data,
      genre_ids: data.genres,
      platform_ids: data.platforms,
      release_date: data.release_date || null,
      cover_url: data.cover_url || null,
    };
    const response = await apiClient.post<Game>('/games/', payload);
    return response.data;
  },

  updateGame: async (id: number | string, data: Partial<GameFormData>): Promise<Game> => {
    const payload: any = { ...data };
    if (data.genres) payload.genre_ids = data.genres;
    if (data.platforms) payload.platform_ids = data.platforms;
    if (data.release_date === '') payload.release_date = null;
    if (data.cover_url === '') payload.cover_url = null;

    const response = await apiClient.put<Game>(`/games/${id}/`, payload);
    return response.data;
  },

  deleteGame: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/games/${id}/`);
  },

  searchRawg: async (query: string): Promise<RawgGame[]> => {
    const response = await apiClient.get<{count: number; results: RawgGame[]}>('/games/search-rawg/', {
      params: { q: query },
    });
    return response.data.results;
  },

  importRawg: async (rawgId: number): Promise<Game> => {
    const response = await apiClient.post<Game>('/games/import-rawg/', { rawg_id: rawgId });
    return response.data;
  },

  uploadCsv: async (formData: FormData): Promise<ImportReport> => {
    const response = await apiClient.post<ImportReport>('/games/upload-csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getGenres: async (): Promise<Genre[]> => {
    const response = await apiClient.get<Genre[]>('/games/genres/');
    return response.data;
  },

  getPlatforms: async (): Promise<Platform[]> => {
    const response = await apiClient.get<Platform[]>('/games/platforms/');
    return response.data;
  },
};
