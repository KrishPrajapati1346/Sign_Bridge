'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthApiError, gestureLoginRequest } from '@/lib/auth-api';
import { getHandLandmarker } from '@/lib/sign/hand-landmarker';
import { predict } from '@/lib/sign/classifier';
import { extractFeatures } from '@/lib/sign/landmark-features';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [mode, setMode] = useState<'password' | 'gesture'>('password');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [gestureStatus, setGestureStatus] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    if (!email) {
      setFormError('Please enter your email first.');
      return;
    }
    setFormError(null);
    setGestureStatus('Starting camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setGestureStatus('Loading AI...');
      
      const landmarker = await getHandLandmarker();
      setGestureStatus('Perform your secret sign to login...');

      predictionIntervalRef.current = setInterval(() => {
        if (!videoRef.current) return;
        const result = landmarker.detectForVideo(videoRef.current, performance.now());
        if (result.landmarks.length > 0) {
          const features = extractFeatures(result.landmarks[0], result.handednesses[0]);
          const prediction = predict(features);
          if (prediction && prediction.confidence > 0.85) {
            handleGestureLoginSubmit(prediction.label);
          }
        }
      }, 150);
    } catch (err) {
      setFormError('Could not access camera.');
      stopCamera();
    }
  };

  const handleGestureLoginSubmit = async (gesturePassword: string) => {
    stopCamera();
    setSubmitting(true);
    setGestureStatus(`Recognized: ${gesturePassword}. Logging in...`);
    try {
      // Actually we need to set tokens in AuthContext, but `gestureLoginRequest` only returns them.
      // Wait, `login` from `useAuth` takes email and password. We need a way to let `useAuth` know we have tokens.
      // Or we can just redirect and let the cookie refresh, but we need the accessToken!
      // Let's modify `useAuth` to expose a `setTokens` or `loginWithGesture` method later.
      // For now, we will call `gestureLoginRequest` directly and just reload the page which will pick up the httpOnly refresh cookie!
      await gestureLoginRequest(email, gesturePassword);
      window.location.href = '/dashboard';
    } catch (err) {
      setFormError(err instanceof AuthApiError ? err.message : 'Invalid gesture password.');
      setSubmitting(false);
      setGestureStatus('');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace('/dashboard');
    } catch (err) {
      setFormError(
        err instanceof AuthApiError ? err.message : 'Something went wrong. Please try again.',
      );
      setSubmitting(false);
    }
  }

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
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-aurora text-white shadow-glow transition group-hover:scale-105"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M4 8v8M20 8v8" strokeLinecap="round" />
              <path d="M4 12h16" strokeLinecap="round" />
            </svg>
          </span>
          SignBridge
        </Link>
      </div>

      <div className="card mt-6 animate-fade-up p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome <span className="text-gradient">back</span>
        </h1>
        <p className="mt-2 text-muted">Log in to continue to SignBridge.</p>

        <div className="mt-8 flex gap-4 border-b border-line pb-4">
          <button
            onClick={() => { setMode('password'); stopCamera(); setFormError(null); }}
            className={`font-semibold ${mode === 'password' ? 'text-signalInk border-b-2 border-signal pb-1' : 'text-muted'}`}
          >
            Password
          </button>
          <button
            onClick={() => { setMode('gesture'); setFormError(null); }}
            className={`font-semibold ${mode === 'gesture' ? 'text-signalInk border-b-2 border-signal pb-1' : 'text-muted'}`}
          >
            Gesture Sign
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink"
              >
                {formError}
              </p>
            )}

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
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-beacon/40 bg-beacon/10 px-4 py-3 text-sm text-ink"
              >
                {formError}
              </p>
            )}
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
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 transition focus:border-signal"
              />
            </div>
            
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black h-48 flex items-center justify-center">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
                <div className="absolute bottom-2 inset-x-0 text-center text-white bg-black/50 px-2 py-1 text-sm font-semibold backdrop-blur-sm">
                  {gestureStatus}
                </div>
              </div>
            ) : (
              <button
                onClick={startCamera}
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60 bg-bridge"
              >
                {submitting ? 'Logging in...' : 'Start Camera to Sign Password'}
              </button>
            )}
          </div>
        )}

        <p className="mt-6 text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-signalInk hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
