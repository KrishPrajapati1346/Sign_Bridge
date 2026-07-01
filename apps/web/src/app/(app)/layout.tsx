import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SettingsProvider } from '@/lib/settings-context';
import { AppShell } from '@/components/AppShell';
import { TourProvider } from '@/components/TourProvider';

/**
 * Layout for the authenticated app. Guards the route, loads user settings
 * (applying them app-wide), and renders the shared shell.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SettingsProvider>
        <AppShell>{children}</AppShell>
        <TourProvider />
      </SettingsProvider>
    </ProtectedRoute>
  );
}
