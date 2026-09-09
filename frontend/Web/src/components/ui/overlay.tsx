'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type OverlayProps = { open: boolean; onClose: () => void; title: string; children: ReactNode };
export function Modal({ open, onClose, title, children }: OverlayProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-xl bg-[var(--surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Drawer({ open, onClose, title, children }: OverlayProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/40"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <aside className="ml-auto h-full w-full max-w-md bg-[var(--surface)] p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </aside>
    </div>
  );
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
}: OverlayProps & { onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="text-sm text-[var(--muted)]">{children}</div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
