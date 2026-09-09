import { apiClient } from '@/services/api-client';

export type HealthResponse = { status: string; timestamp?: string };

export const healthRepository = {
  get: () => apiClient<HealthResponse>('/health'),
};
