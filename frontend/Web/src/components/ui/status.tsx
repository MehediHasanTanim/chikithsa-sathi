import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center gap-3 text-[var(--muted)]">
      <LoaderCircle className="size-5 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  onRetry,
}: {
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="size-8 text-red-500" />
      <p className="font-medium">{title}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center">
      <Inbox className="size-8 text-[var(--muted)]" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--muted)]">{description}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-[var(--surface-muted)] ${className}`}
    />
  );
}
