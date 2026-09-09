'use client';

import Link from 'next/link';
import { ChevronLeft, HeartPulse } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/components/layout/navigation';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/stores/app-store';

function Brand({ compact }: { compact: boolean }) {
  return (
    <div className={cn('care-brand', compact && 'justify-center px-0')}>
      <span className="care-brand-mark">
        <HeartPulse className="size-5" strokeWidth={3} />
      </span>
      {!compact && (
        <span>
          <strong>CareChamber</strong>
          <small>Better Care. Better Lives.</small>
        </span>
      )}
    </div>
  );
}

export function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const compact = !mobile && collapsed;

  return (
    <aside
      className={cn(
        'care-sidebar',
        compact && 'care-sidebar--compact',
        mobile && 'care-sidebar--mobile',
      )}
    >
      <Brand compact={compact} />
      <nav className="care-nav" aria-label="Main navigation">
        {navigationItems.map(({ href, key, icon: Icon, group }, index) => {
          const previous = navigationItems[index - 1];
          const divider = group && group !== previous?.group;
          return (
            <div key={href} className={cn(divider && 'care-nav-section')}>
              <Link
                onClick={onNavigate}
                href={href}
                title={compact ? t(key) : undefined}
                className={cn(
                  'care-nav-link',
                  pathname === href && 'care-nav-link--active',
                  compact && 'justify-center px-0',
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={2.1} />
                {!compact && <span>{t(key)}</span>}
              </Link>
            </div>
          );
        })}
      </nav>
      {!mobile && (
        <div className="care-collapse">
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            className={cn('care-collapse-button', compact && 'justify-center px-0')}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn('size-[18px] transition-transform', compact && 'rotate-180')}
            />
            {!compact && 'Collapse'}
          </Button>
        </div>
      )}
    </aside>
  );
}
