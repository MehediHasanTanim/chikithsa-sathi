import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/features/auth/auth-forms';
import { Suspense } from 'react';
export default function ResetPasswordPage() {
  return (
    <AuthShell aside={false}>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
