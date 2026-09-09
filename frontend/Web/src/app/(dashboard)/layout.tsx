import { AppShell } from '@/components/layout/app-shell';
import { AuthGate } from '@/features/auth/auth-gate';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
