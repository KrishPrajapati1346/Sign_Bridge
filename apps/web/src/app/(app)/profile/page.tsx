'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/use-translation';
import { AuthApiError } from '@/lib/auth-api';
import { changePassword, updateProfile } from '@/lib/users-api';
import { PageHeader } from '@/components/PageHeader';

export default function ProfilePage() {
  const { user, authFetch, updateUser } = useAuth();
  const t = useT();

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('profile.title')} context={t('profile.context')} />

      <div className="space-y-8">
        <AccountSection
          email={user?.email ?? ''}
          initialRole={user?.role ?? 'HEARING_USER'}
          initialName={user?.name ?? ''}
          authFetch={authFetch}
          updateUser={updateUser}
          user={user!}
        />
        <PasswordSection authFetch={authFetch} />
      </div>
    </div>
  );
}

type AuthFetch = ReturnType<typeof useAuth>['authFetch'];

function Card({ children }: { children: React.ReactNode }) {
  return <section className="card p-6">{children}</section>;
}

const inputClass =
  'mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink transition focus:border-signal';

function AccountSection({
  email,
  initialRole,
  initialName,
  authFetch,
  updateUser,
  user,
}: {
  email: string;
  initialRole: string;
  initialName: string;
  authFetch: AuthFetch;
  updateUser: (u: any) => void;
  user: any;
}) {
  const t = useT();
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole as 'HEARING_USER' | 'DEAF_USER' | 'LEARNER');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setSuccess(false);
    setError(null);
    try {
      const { profile } = await updateProfile(authFetch, name.trim(), role);
      setName(profile.name ?? '');
      setRole(profile.role as any);
      updateUser({ ...user, name: profile.name, role: profile.role });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : t('profile.saveError'));
    } finally {
      setStatus('idle');
    }
  }

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-ink">{t('profile.account')}</h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted">{t('profile.email')}</dt>
          <dd className="mt-1 text-ink">{email}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit} className="mt-6 max-w-sm space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            {t('profile.name')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSuccess(false);
            }}
            maxLength={80}
            required
            aria-describedby={error ? 'name-error' : success ? 'name-success' : undefined}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-ink">
            {t('profile.role')}
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'HEARING_USER' | 'DEAF_USER' | 'LEARNER');
              setSuccess(false);
            }}
            className={inputClass}
          >
            <option value="HEARING_USER">{t('role.HEARING_USER')}</option>
            <option value="DEAF_USER">{t('role.DEAF_USER')}</option>
            <option value="LEARNER">{t('role.LEARNER')}</option>
          </select>
        </div>

        {error && (
          <p id="name-error" role="alert" className="mt-1 text-sm text-beacon">
            {error}
          </p>
        )}
        {success && (
          <p id="name-success" role="status" className="mt-1 text-sm text-bridge">
            {t('profile.nameUpdated')}
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'saving'}
          className="btn-primary mt-4 px-6 py-3 disabled:opacity-60"
        >
          {status === 'saving' ? t('profile.saving') : t('profile.saveChanges')}
        </button>
      </form>
    </Card>
  );
}

function PasswordSection({ authFetch }: { authFetch: AuthFetch }) {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setSuccess(false);
    setError(null);
    try {
      await changePassword(authFetch, currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : t('profile.passwordError'));
    } finally {
      setStatus('idle');
    }
  }

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold text-ink">{t('profile.changePassword')}</h2>
      <p className="mt-1 text-sm text-muted">{t('profile.passwordHint')}</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-sm space-y-4" noValidate>
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-ink">
            {t('profile.currentPassword')}
          </label>
          <input
            id="current-password"
            name="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-describedby={error ? 'password-error' : undefined}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-ink">
            {t('profile.newPassword')}
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-describedby={error ? 'password-error' : 'new-password-hint'}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
          <p id="new-password-hint" className="mt-1 text-sm text-muted">
            {t('profile.passwordRule')}
          </p>
        </div>

        {error && (
          <p id="password-error" role="alert" className="text-sm text-beacon">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm text-bridge">
            {t('profile.passwordUpdated')}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="btn-primary px-6 py-3 disabled:opacity-60"
        >
          {status === 'saving' ? t('profile.updating') : t('profile.updatePassword')}
        </button>
      </form>
    </Card>
  );
}

