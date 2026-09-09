import { cn } from '@/lib/cn';
import type { PropsWithChildren } from 'react';

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {children}
    </section>
  );
}
