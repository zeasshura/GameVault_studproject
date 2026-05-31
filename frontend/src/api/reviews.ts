import apiClient from './client';
import type { Review } from '../types';

interface ReviewPayload {
  text: string;
  score: number;
}

export const reviewsApi = {
  getReviews: async (gameId: number | string): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/reviews/games/${gameId}/reviews/`);
    return response.data;
  },

  createReview: async (gameId: number | string, data: ReviewPayload): Promise<Review> => {
    const response = await apiClient.post<Review>(`/reviews/games/${gameId}/reviews/`, data);
    return response.data;
  },

  updateReview: async (id: number | string, data: ReviewPayload): Promise<Review> => {
    const response = await apiClient.put<Review>(`/reviews/${id}/`, data);
    return response.data;
  },

  deleteReview: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/reviews/${id}/`);
  },
};
