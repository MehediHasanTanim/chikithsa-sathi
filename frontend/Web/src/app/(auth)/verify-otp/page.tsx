import { AuthShell } from '@/components/auth-shell';
import { OtpForm } from '@/features/auth/auth-forms';
import { Suspense } from 'react';
export default function VerifyOtpPage() {
  return (
    <AuthShell aside={false}>
      <Suspense>
        <OtpForm />
      </Suspense>
    </AuthShell>
  );
}
