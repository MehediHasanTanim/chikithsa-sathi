import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  action,
  crumb,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  crumb?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {crumb && (
          <nav className="mb-2 flex items-center gap-1 text-sm text-[var(--muted)]">
            <Link href="/dashboard" className="hover:text-[var(--foreground)]">
              Dashboard
            </Link>
            <>
              <ChevronRight className="size-4" />
              <span>{crumb}</span>
            </>
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
