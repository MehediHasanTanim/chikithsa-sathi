'use client';

import { useState, type ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Drawer } from '@/components/ui/overlay';

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div className="care-app-shell">
      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar />
      </div>
      <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Navigation">
        <Sidebar mobile onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>
      <main className="care-workspace">
        <Header onOpenNavigation={() => setMobileNavOpen(true)} />
        <div className="care-main-content">{children}</div>
      </main>
    </div>
  );
}
