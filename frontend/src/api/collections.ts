import apiClient from './client';
import type { Collection } from '../types';

export const collectionsApi = {
  getCollections: async (): Promise<Collection[]> => {
    const response = await apiClient.get<Collection[]>('/collections/');
    return response.data;
  },

  createCollection: async (name: string): Promise<Collection> => {
    const response = await apiClient.post<Collection>('/collections/', { name });
    return response.data;
  },

  addGameToCollection: async (collectionId: number, gameId: number): Promise<void> => {
    await apiClient.post(`/collections/${collectionId}/games/`, { game_id: gameId });
  },

  removeGameFromCollection: async (collectionId: number, gameId: number): Promise<void> => {
    await apiClient.delete(`/collections/${collectionId}/games/${gameId}/`);
  },
};
