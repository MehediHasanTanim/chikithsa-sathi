import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/features/auth/auth-forms';
import { Suspense } from 'react';
export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
