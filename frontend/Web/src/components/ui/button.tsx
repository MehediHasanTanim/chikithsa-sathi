import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        {
          primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]',
          secondary: 'border bg-[var(--surface)] hover:bg-[var(--surface-muted)]',
          ghost: 'hover:bg-[var(--surface-muted)]',
          danger: 'bg-red-600 text-white hover:bg-red-700',
        }[variant],
        { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-11 px-5' }[size],
        className,
      )}
      {...props}
    />
  );
}
