import { z } from 'zod';

const phone = z
  .string()
  .regex(/^(?:\+8801|8801|01)[3-9]\d{8}$/, 'Enter a valid Bangladesh mobile number.');
const password = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Password is too long.');

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean(),
});
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name.').max(200),
  phone,
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  password,
  terms: z.boolean().refine(Boolean, 'You must accept the terms to continue.'),
});
export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the six-digit code.'),
});
export const resetSchema = z
  .object({
    phone,
    otp: z.string().regex(/^\d{6}$/, 'Enter the six-digit code.'),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type OtpValues = z.infer<typeof otpSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
