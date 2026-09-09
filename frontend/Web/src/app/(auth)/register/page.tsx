import { AuthShell } from '@/components/auth-shell';
import { RegisterForm } from '@/features/auth/auth-forms';
export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
