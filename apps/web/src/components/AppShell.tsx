'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, Sun, Moon, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/use-translation';
import { NAV_ITEMS } from '@/lib/nav';
import { NavDrawer } from './NavDrawer';
import { CallRinger } from './CallRinger';
import { useTheme } from 'next-themes';

/** The authenticated application shell: sidebar on desktop, top bar + bottom nav + drawer on mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useT();

  return (
    <div className="min-h-screen pb-16 lg:pb-4 lg:pl-[20rem] lg:pt-4 lg:pr-4">
      <CallRinger />
      
      {/* Mobile Top Header */}
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <Wordmark />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-canvas">
            <UserIcon aria-hidden="true" className="h-5 w-5" />
          </Link>
          <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-canvas">
            <Settings aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Desktop Sidebar (Floating Glass Panel) */}
      <aside className="hidden lg:fixed lg:inset-y-4 lg:left-4 lg:z-30 lg:flex lg:w-72 lg:flex-col lg:rounded-[2rem] lg:border lg:border-white/10 lg:bg-surface/60 lg:backdrop-blur-3xl lg:shadow-2xl lg:py-8 transition-all duration-500 hover:bg-surface/80">
        <div className="flex items-center px-8">
          <Wordmark />
        </div>
        <nav
          aria-label="Primary"
          className="mt-10 flex flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-5"
        >
          <NavLinks pathname={pathname} />
        </nav>
        <div className="border-t border-white/10 px-5 pt-6 mt-4">
          <UserChip />
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t('common.nav') || 'Navigation'}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <Wordmark />
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={t('common.closeMenu') || 'Close menu'}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto overscroll-contain">
          <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
        </nav>
        <div className="border-t border-line px-3 py-4">
          <UserChip />
        </div>
      </NavDrawer>

      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-12">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-sm text-muted sm:px-6 lg:px-10">
        <p>{t('common.tagline')}</p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav pathname={pathname} onMoreClick={() => setDrawerOpen(true)} />
    </div>
  );
}

function MobileBottomNav({ pathname, onMoreClick }: { pathname: string, onMoreClick: () => void }) {
  const t = useT();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // For bottom nav, we might only want to show the primary 4 items to avoid crowding.
  const bottomNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly && ['/dashboard', '/call', '/translate', '/learn'].includes(item.href)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-line bg-canvas/90 backdrop-blur-md pb-safe lg:hidden">
      {bottomNavItems.map(({ href, label, labelKey, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${
              active ? 'text-signalInk' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t(labelKey) || label}</span>
          </Link>
        );
      })}
      
      {/* "More" Button */}
      <button
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted hover:text-ink transition"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}

function Wordmark() {
  return (
    <Link
      href="/dashboard"
      className="group flex items-center gap-2 rounded font-display text-lg font-semibold tracking-tight text-ink"
    >
      <img
        src="/logo.png"
        alt="SignBridge Logo"
        className="h-7 w-7 rounded-lg shadow-glow transition group-hover:scale-105 object-cover"
      />
      SignBridge
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const t = useT();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
        ({ href, label, labelKey, icon: Icon, emphasis }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const emergency = emphasis === 'emergency';
          const className = emergency
            ? `flex min-h-12 items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                active ? 'bg-beacon text-white shadow-lg scale-105' : 'text-beacon hover:bg-beacon/10 hover:scale-[1.02]'
              }`
            : `flex min-h-12 items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                active
                  ? 'bg-gradient-to-r from-signal/20 to-iris/20 text-signalInk ring-1 ring-inset ring-white/10 shadow-lg scale-105'
                  : 'text-ink hover:bg-white/5 hover:shadow-md hover:scale-[1.02]'
              }`;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={className}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              {t(labelKey) || label}
            </Link>
          );
        },
      )}
    </>
  );
}

function UserChip() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useT();

  async function handleLogout() {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
      router.replace('/login');
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {user?.name ?? user?.email ?? t('common.signedIn') ?? 'Signed in'}
        </p>
        <p className="truncate text-xs text-muted">{user ? (t(`role.${user.role}`) || user.role) : ''}</p>
      </div>
      <div className="flex items-center">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          aria-label={t('common.logout') || 'Log out'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-10 w-10" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-canvas"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
