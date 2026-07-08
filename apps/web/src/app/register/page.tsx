'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SELECTABLE_ROLES, type UserRole } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { AuthApiError } from '@/lib/auth-api';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';

const ROLE_LABELS: Record<UserRole, string> = {
  DEAF_USER: 'Deaf user',
  HEARING_USER: 'Hearing user',
  LEARNER: 'Learner',
  ADMIN: 'Administrator',
};

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(SELECTABLE_ROLES[0] ?? 'HEARING_USER');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register({ email, password, role, name: name.trim() || undefined });
      localStorage.setItem('signbridge_needs_tour', 'true');
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof AuthApiError) {
        setFormError(err.message);
        setFieldErrors(err.details ?? {});
      } else {
        setFormError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  }

  const fieldError = (field: string): string | undefined => fieldErrors[field]?.[0];

  return (
    <main
      id="main"
      className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-hero-mesh opacity-60"
      />
      <div className="animate-fade-up">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          <img 
            src="/logo.png" 
            alt="SignBridge Logo" 
            className="w-8 h-8 rounded-lg shadow-glow transition group-hover:scale-105 object-cover"
          />
          SignBridge
        </Link>
      </div>

      <div className="card mt-6 animate-fade-up p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Create your <span className="text-gradient">account</span>
        </h1>
        <p className="mt-2 text-muted">Join SignBridge.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink"
            >
              {formError}
            </p>
          )}

          <div className="flex justify-center">
            <GoogleAuthButton
              onSuccess={async (token) => {
                try {
                  await loginWithGoogle(token);
                  localStorage.setItem('signbridge_needs_tour', 'true');
                  router.replace('/dashboard');
                } catch (err) {
                  setFormError(
                    err instanceof AuthApiError ? err.message : 'Google sign-up failed.',
                  );
                }
              }}
              onError={() => {
                setFormError('Google sign-up failed.');
              }}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-2 text-muted">Or continue with email</span>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-describedby={fieldError('name') ? 'name-error' : undefined}
              aria-invalid={fieldError('name') ? true : undefined}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
            />
            {fieldError('name') && (
              <p id="name-error" className="mt-1 text-sm text-beacon">
                {fieldError('name')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={fieldError('email') ? 'email-error' : undefined}
              aria-invalid={fieldError('email') ? true : undefined}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
            />
            {fieldError('email') && (
              <p id="email-error" className="mt-1 text-sm text-beacon">
                {fieldError('email')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={fieldError('password') ? 'password-error' : 'password-hint'}
              aria-invalid={fieldError('password') ? true : undefined}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
            />
            {fieldError('password') ? (
              <p id="password-error" className="mt-1 text-sm text-beacon">
                {fieldError('password')}
              </p>
            ) : (
              <p id="password-hint" className="mt-1 text-sm text-ink/50">
                At least 8 characters.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium">
              I am a…
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              aria-describedby={fieldError('role') ? 'role-error' : undefined}
              aria-invalid={fieldError('role') ? true : undefined}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
            >
              {SELECTABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            {fieldError('role') && (
              <p id="role-error" className="mt-1 text-sm text-beacon">
                {fieldError('role')}
              </p>
            )}
          </div>

          <p className="text-[13px] text-muted text-center mt-2 mb-2 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-ink transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-ink transition-colors">Privacy Policy</Link>.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-signalInk hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
