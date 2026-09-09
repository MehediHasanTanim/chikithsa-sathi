'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { AuthLink } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { authRepository } from '@/repositories/auth.repository';
import {
  loginSchema,
  otpSchema,
  registerSchema,
  resetSchema,
  type LoginValues,
  type OtpValues,
  type RegisterValues,
  type ResetValues,
} from '@/schemas/auth.schemas';
import { establishSession } from '@/features/auth/session';
import { useSessionStore } from '@/stores/session-store';
import { ApiError } from '@/types/api';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      {children}
      {error && <em>{error}</em>}
    </label>
  );
}
function Submit({ children, busy }: { children: React.ReactNode; busy: boolean }) {
  return (
    <Button className="auth-submit" type="submit" disabled={busy}>
      {busy && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

export function LoginForm() {
  const router = useRouter();
  const query = useSearchParams();
  const setOnboarding = useSessionStore((s) => s.setOnboarding);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });
  const submit = async (values: LoginValues) => {
    setServerError('');
    try {
      const session = await authRepository.login({
        phone: values.phone,
        password: values.password,
      });
      establishSession(session, values.remember);
      const progress = await authRepository.onboarding(session.accessToken);
      setOnboarding(progress);
      router.replace(progress.complete ? query.get('next') || '/dashboard' : '/onboarding');
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };
  return (
    <>
      <div className="auth-title">
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit(submit)}>
        <Field label="Mobile number" error={errors.phone?.message}>
          <Input placeholder="01XXXXXXXXX" autoComplete="tel" {...register('phone')} />
        </Field>
        <PasswordField
          label="Password"
          error={errors.password?.message}
          register={register('password')}
        />
        <div className="auth-options">
          <label>
            <input type="checkbox" {...register('remember')} /> Remember me on this device
          </label>
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </div>
        {serverError && <p className="auth-server-error">{serverError}</p>}
        <Submit busy={isSubmitting}>Sign In</Submit>
      </form>
      <p className="auth-switch">
        New to CareChamber? <AuthLink href="/register">Create an account</AuthLink>
      </p>
    </>
  );
}

function PasswordField({
  label,
  error,
  register,
}: {
  label: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  const [shown, setShown] = useState(false);
  return (
    <Field label={label} error={error}>
      <div className="auth-password">
        <Input type={shown ? 'text' : 'password'} autoComplete="current-password" {...register} />
        <button type="button" aria-label="Show password" onClick={() => setShown(!shown)}>
          {shown ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </Field>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const submit = async (values: RegisterValues) => {
    setServerError('');
    try {
      await authRepository.register({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        password: values.password,
        preferredLanguage: 'en',
      });
      router.push(`/verify-otp?phone=${encodeURIComponent(values.phone)}&flow=registration`);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };
  return (
    <>
      <div className="auth-title">
        <h1>Create your account</h1>
        <p>Start managing your chamber with CareChamber.</p>
      </div>
      <form onSubmit={handleSubmit(submit)}>
        <Field label="Full name" error={errors.fullName?.message}>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Mobile number" error={errors.phone?.message}>
          <Input placeholder="01XXXXXXXXX" autoComplete="tel" {...register('phone')} />
        </Field>
        <Field label="Email address (optional)" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <PasswordField
          label="Password"
          error={errors.password?.message}
          register={register('password')}
        />
        <label className="auth-options">
          <input type="checkbox" {...register('terms')} /> I agree to the Terms of Service and
          Privacy Policy.
        </label>
        {serverError && <p className="auth-server-error">{serverError}</p>}
        <Submit busy={isSubmitting}>Create account</Submit>
      </form>
      <p className="auth-switch">
        Already have an account? <AuthLink href="/login">Sign in</AuthLink>
      </p>
    </>
  );
}

export function OtpForm() {
  const router = useRouter();
  const query = useSearchParams();
  const phone = query.get('phone') ?? '';
  const flow = query.get('flow') ?? 'registration';
  const [serverError, setServerError] = useState('');
  const [resent, setResent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });
  const submit = async ({ otp }: OtpValues) => {
    setServerError('');
    try {
      if (flow === 'reset')
        router.push(`/reset-password?phone=${encodeURIComponent(phone)}&otp=${otp}`);
      else {
        await authRepository.verifyOtp(phone, otp);
        router.push('/login?verified=1');
      }
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };
  return (
    <>
      <div className="auth-title auth-title--center">
        <h1>Verify your account</h1>
        <p>
          We sent a 6-digit code to <b>{phone || 'your mobile number'}</b>.
        </p>
      </div>
      <form onSubmit={handleSubmit(submit)}>
        <Field label="Verification code" error={errors.otp?.message}>
          <Input
            className="auth-otp-input"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            {...register('otp')}
          />
        </Field>
        {serverError && <p className="auth-server-error">{serverError}</p>}
        <Submit busy={isSubmitting}>Verify</Submit>
      </form>
      <div className="auth-resend">
        Didn&apos;t receive it?{' '}
        <button
          onClick={async () => {
            await authRepository.resendOtp(phone);
            setResent(true);
          }}
          disabled={!phone}
        >
          {resent ? 'Code resent' : 'Resend code'}
        </button>
      </div>
    </>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <>
      <AuthLink href="/login">← Back to Sign In</AuthLink>
      <div className="auth-title">
        <h1>Forgot password?</h1>
        <p>Enter the mobile number associated with your account.</p>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            await authRepository.requestPasswordReset(phone);
            router.push(`/verify-otp?phone=${encodeURIComponent(phone)}&flow=reset`);
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Mobile number">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="01XXXXXXXXX"
            required
          />
        </Field>
        {error && <p className="auth-server-error">{error}</p>}
        <Submit busy={busy}>Continue</Submit>
      </form>
    </>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const query = useSearchParams();
  const phone = query.get('phone') ?? '';
  const otp = query.get('otp') ?? '';
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { phone, otp } });
  const submit = async (v: ResetValues) => {
    setServerError('');
    try {
      await authRepository.confirmPasswordReset(v.phone, v.otp, v.password);
      router.push('/login?reset=1');
    } catch (e) {
      setServerError(errorMessage(e));
    }
  };
  return (
    <>
      <div className="auth-title">
        <h1>Create a new password</h1>
        <p>Choose a strong password you haven&apos;t used before.</p>
      </div>
      <form onSubmit={handleSubmit(submit)}>
        <input type="hidden" {...register('phone')} />
        <input type="hidden" {...register('otp')} />
        <PasswordField
          label="New password"
          error={errors.password?.message}
          register={register('password')}
        />
        <PasswordField
          label="Confirm new password"
          error={errors.confirmPassword?.message}
          register={register('confirmPassword')}
        />
        {serverError && <p className="auth-server-error">{serverError}</p>}
        <Submit busy={isSubmitting}>Reset Password</Submit>
      </form>
    </>
  );
}
