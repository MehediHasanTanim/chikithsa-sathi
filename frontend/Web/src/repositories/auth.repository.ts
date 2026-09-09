import { apiClient } from '@/services/api-client';
import type { AuthSession, AuthTokens, OnboardingProgress } from '@/types/auth';

export type LoginInput = { phone: string; password: string };
export type RegisterInput = {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  preferredLanguage: 'en' | 'bn';
  otpChannel?: 'sms' | 'email';
};

export const authRepository = {
  login: (input: LoginInput) =>
    apiClient<AuthSession>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    apiClient<{ userId: string; verificationRequired: boolean; otpExpiresAt: string }>(
      '/auth/register',
      { method: 'POST', body: input },
    ),
  verifyOtp: (phone: string, otp: string) =>
    apiClient<{ verified: boolean }>('/auth/verify-otp', { method: 'POST', body: { phone, otp } }),
  resendOtp: (phone: string, otpChannel?: 'sms' | 'email') =>
    apiClient<{ otpExpiresAt: string }>('/auth/resend-otp', {
      method: 'POST',
      body: { phone, otpChannel },
    }),
  requestPasswordReset: (phone: string) =>
    apiClient<{ accepted: boolean; otpExpiresAt: string }>('/auth/password-reset/request', {
      method: 'POST',
      body: { phone },
    }),
  confirmPasswordReset: (phone: string, otp: string, password: string) =>
    apiClient<{ reset: boolean }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: { phone, otp, password },
    }),
  refresh: (refreshToken: string) =>
    apiClient<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
  logout: (refreshToken: string, accessToken: string) =>
    apiClient('/auth/logout', { method: 'POST', body: { refreshToken }, accessToken }),
  onboarding: (accessToken: string) =>
    apiClient<OnboardingProgress>('/auth/onboarding', { accessToken }),
};
