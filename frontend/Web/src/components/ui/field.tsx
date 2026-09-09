import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'h-10 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none';
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, className)} {...props}>
      {children}
    </select>
  );
}
export function DatePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="date" {...props} />;
}
export function TimePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="time" {...props} />;
}
