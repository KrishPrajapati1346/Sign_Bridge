import {
  LayoutDashboard,
  Mic,
  Hand,
  Users,
  Video,
  Languages,
  PersonStanding,
  GraduationCap,
  Siren,
  History,
  Settings,
  User,
  BarChart3,
  BookA,
  Contact,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  /** English label; also the fallback when a translation is missing. */
  label: string;
  /** Translation key resolved via `useT()` for the active interface language. */
  labelKey: string;
  icon: LucideIcon;
  /** Emergency entry is styled distinctly (beacon) for fast recognition. */
  emphasis?: 'emergency';
  adminOnly?: boolean;
}

/** Primary navigation for the authenticated app shell. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', labelKey: 'nav.contacts', icon: Contact },
  { href: '/dictionary', label: 'Dictionary', labelKey: 'nav.dictionary', icon: BookA },
  { href: '/live', label: 'Live conversation', labelKey: 'nav.live', icon: Users },
  { href: '/call', label: 'Video call', labelKey: 'nav.call', icon: Video },
  { href: '/speech', label: 'Speech', labelKey: 'nav.speech', icon: Mic },
  { href: '/sign', label: 'Sign recognition', labelKey: 'nav.sign', icon: Hand },
  { href: '/avatar', label: '3D Avatar', labelKey: 'nav.avatar', icon: PersonStanding },
  { href: '/translate/document', label: 'Sign-to-Document', labelKey: 'nav.document', icon: Languages },
  { href: '/documents', label: 'Saved Documents', labelKey: 'nav.documents', icon: FileText },
  { href: '/learn', label: 'Learning Center', labelKey: 'nav.learn', icon: GraduationCap },
  {
    href: '/emergency',
    label: 'Emergency',
    labelKey: 'nav.emergency',
    icon: Siren,
    emphasis: 'emergency',
  },
  { href: '/history', label: 'History', labelKey: 'nav.history', icon: History },
  { href: '/profile', label: 'Profile', labelKey: 'nav.profile', icon: User },
  { href: '/settings', label: 'Settings', labelKey: 'nav.settings', icon: Settings },
  {
    href: '/admin',
    label: 'Admin Dashboard',
    labelKey: 'nav.admin',
    icon: BarChart3,
    adminOnly: true,
  },
  {
    href: '/admin/signs',
    label: 'Review Signs',
    labelKey: 'nav.adminSigns',
    icon: Hand,
    adminOnly: true,
  },
];

export const ROLE_LABELS: Record<string, string> = {
  DEAF_USER: 'Deaf user',
  HEARING_USER: 'Hearing user',
  LEARNER: 'Learner',
  ADMIN: 'Administrator',
};
