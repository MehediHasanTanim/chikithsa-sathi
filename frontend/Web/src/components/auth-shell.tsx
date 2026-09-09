import Link from 'next/link';
import { HeartPulse } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthShell({ children, aside = true }: { children: ReactNode; aside?: boolean }) {
  return (
    <main className="auth-page">
      {aside && (
        <aside className="auth-aside">
          <div className="auth-brand">
            <span>
              <HeartPulse />
            </span>
            <div>
              <b>CareChamber</b>
              <small>Simpler Care. Healthier Communities.</small>
            </div>
          </div>
          <div className="auth-aside-copy">
            <h2>Manage your chamber efficiently</h2>
            <p>Appointments, patients, prescriptions, billing and more — all in one place.</p>
            <div className="auth-illustration">✚</div>
            <ul>
              <li>▣ Appointments</li>
              <li>▣ Patient records</li>
              <li>▣ Prescriptions</li>
              <li>▣ Billing & reports</li>
            </ul>
          </div>
        </aside>
      )}
      <section className="auth-content">
        <div className="auth-top">
          <div className="auth-brand auth-brand--mobile">
            <span>
              <HeartPulse />
            </span>
            <div>
              <b>CareChamber</b>
              <small>Simpler Care. Healthier Communities.</small>
            </div>
          </div>
          <select aria-label="Language">
            <option>English</option>
            <option>বাংলা</option>
          </select>
        </div>
        <div className="auth-card">{children}</div>
        <footer>
          Privacy Policy <i>·</i> Terms of Service <i>·</i> Help & Support <i>·</i> v1.0.0
        </footer>
      </section>
    </main>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="auth-link" href={href}>
      {children}
    </Link>
  );
}
