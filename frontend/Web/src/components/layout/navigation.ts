import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageCircle,
  ReceiptText,
  Settings,
  Sparkles,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export type NavigationItem = {
  href: string;
  key:
    | 'dashboard'
    | 'patients'
    | 'appointments'
    | 'queue'
    | 'consultations'
    | 'prescriptions'
    | 'investigations'
    | 'payments'
    | 'chambers'
    | 'reports'
    | 'communication'
    | 'aiAssistant'
    | 'settings';
  icon: LucideIcon;
  group?: 'secondary' | 'settings';
};

export const navigationItems: NavigationItem[] = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/appointments', key: 'appointments', icon: CalendarDays },
  { href: '/queue', key: 'queue', icon: ClipboardList },
  { href: '/patients', key: 'patients', icon: UsersRound },
  { href: '/consultations', key: 'consultations', icon: Stethoscope },
  { href: '/prescriptions', key: 'prescriptions', icon: FileText },
  { href: '/investigations', key: 'investigations', icon: FlaskConical },
  { href: '/payments', key: 'payments', icon: ReceiptText },
  { href: '/chambers', key: 'chambers', icon: Building2 },
  { href: '/reports', key: 'reports', icon: Activity },
  { href: '/ai-assistant', key: 'aiAssistant', icon: Sparkles, group: 'secondary' },
  { href: '/communication', key: 'communication', icon: MessageCircle, group: 'secondary' },
  { href: '/settings', key: 'settings', icon: Settings, group: 'settings' },
];
