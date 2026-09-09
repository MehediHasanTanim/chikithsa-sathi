import { apiClient } from '@/services/api-client';

export type Chamber = { id: string; name: string };
export const onboardingRepository = {
  updateProfile: (accessToken: string, body: { fullName?: string; designation?: string }) =>
    apiClient('/doctors/me', { method: 'PATCH', body, accessToken }),
  updateProfessional: (
    accessToken: string,
    body: {
      specialization?: string;
      qualifications?: string[];
      bmdcNumber?: string;
      yearsOfExperience?: number;
    },
  ) => apiClient('/doctors/me/professional-profile', { method: 'PATCH', body, accessToken }),
  createChamber: (
    accessToken: string,
    body: {
      name: string;
      address?: { area?: string; city?: string };
      consultationFee?: number;
      timezone: string;
      currency: string;
    },
  ) => apiClient<Chamber>('/chambers', { method: 'POST', body, accessToken }),
  createSchedule: (
    accessToken: string,
    chamberId: string,
    body: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
      maxPatients: number;
    },
  ) => apiClient(`/chambers/${chamberId}/schedules`, { method: 'POST', body, accessToken }),
  inviteStaff: (
    accessToken: string,
    chamberId: string,
    body: { phone: string; role: 'RECEPTIONIST' | 'ASSISTANT_DOCTOR' | 'CHAMBER_MANAGER' },
  ) => apiClient(`/chambers/${chamberId}/staff/invite`, { method: 'POST', body, accessToken }),
};
