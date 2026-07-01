'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleDot, Circle, GraduationCap, Dumbbell, Flame, Star } from 'lucide-react';
import { LESSONS, type LessonProgress, type LessonStatus } from '@signbridge/shared-types';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { getProgress } from '@/lib/learning-api';
import { useT } from '@/lib/i18n/use-translation';

const TOTAL_LABELS = new Set(LESSONS.flatMap((l) => l.labels)).size;

function statusOf(progress: LessonProgress[], lessonId: string): LessonStatus {
  return progress.find((p) => p.lessonId === lessonId)?.status ?? 'NOT_STARTED';
}

const STATUS_META: Record<LessonStatus, { labelKey: string; icon: typeof Circle; cls: string }> = {
  NOT_STARTED: {
    labelKey: 'learn.index.status.notStarted',
    icon: Circle,
    cls: 'border-line bg-canvas text-muted',
  },
  IN_PROGRESS: {
    labelKey: 'learn.index.status.inProgress',
    icon: CircleDot,
    cls: 'border-signalInk/20 bg-signalInk/10 text-signalInk',
  },
  COMPLETED: {
    labelKey: 'learn.index.status.completed',
    icon: CheckCircle2,
    cls: 'border-bridge/20 bg-bridge/10 text-bridge',
  },
};

export default function LearnPage() {
  const t = useT();
  const { authFetch } = useAuth();
  const [lessons, setLessons] = useState<LessonProgress[]>([]);
  const [practicedLabels, setPracticedLabels] = useState(0);
  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await getProgress(authFetch);
      setLessons(data.lessons);
      setPracticedLabels(data.mastery.filter((m) => m.correctCount > 0).length);
      setXp(data.xp);
      setStreakDays(data.streakDays);
    } catch {
      /* non-fatal */
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const completed = useMemo(
    () => LESSONS.filter((l) => statusOf(lessons, l.id) === 'COMPLETED').length,
    [lessons],
  );

  const currentLevel = Math.floor(xp / 50) + 1;
  const xpIntoLevel = xp % 50;
  const xpForNextLevel = 50;
  const levelProgressPct = Math.round((xpIntoLevel / xpForNextLevel) * 100);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('learn.index.title')} context={t('learn.index.context')} />

      <div className="mb-8 flex flex-col sm:flex-row gap-6 rounded-2xl border border-line bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-6 pr-6 sm:border-r border-line">
          <div className="flex items-center gap-3 text-orange-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Flame className="h-6 w-6" fill="currentColor" />
            </div>
            <div>
              <span className="block font-display text-2xl font-bold text-ink leading-none">{streakDays}</span>
              <span className="text-sm font-medium text-muted">Day Streak</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Star className="h-4 w-4" fill="currentColor" />
              </div>
              <span className="font-display text-lg font-bold text-ink">Level {currentLevel}</span>
            </div>
            <span className="text-sm font-medium text-muted">
              {xpIntoLevel} / {xpForNextLevel} XP
            </span>
          </div>
          
          <div className="h-3 overflow-hidden rounded-full bg-canvas w-full">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500" 
              style={{ width: `${levelProgressPct}%` }} 
            />
          </div>
          <p className="mt-2 text-xs text-muted text-right">
            Total XP: {xp}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <Link 
          href="/dictionary" 
          className="group flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-bridge/20 bg-bridge/5 p-6 transition-all hover:bg-bridge/10 hover:border-bridge/30"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bridge/10 text-bridge">
              <span className="font-display text-2xl font-bold" aria-hidden="true">Aa</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Sign Language Dictionary</h2>
              <p className="mt-1 text-sm text-muted max-w-md">Browse our entire 3D animated vocabulary, study hand postures from any angle, and expand your sign language skills.</p>
            </div>
          </div>
          <div className="btn-primary whitespace-nowrap px-6 py-3 shrink-0">Open Dictionary</div>
        </Link>
      </div>

      <section aria-labelledby="summary-heading" className="card mb-8 p-6">
        <h2 id="summary-heading" className="chip">
          {t('learn.index.progressHeading')}
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <ProgressBar
            label={t('learn.index.lessonsCompleted')}
            value={completed}
            max={LESSONS.length}
          />
          <ProgressBar
            label={t('learn.index.signsPracticed')}
            value={practicedLabels}
            max={TOTAL_LABELS}
          />
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson) => {
          const status = statusOf(lessons, lesson.id);
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <li key={lesson.id} className="card group p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="icon-tile h-11 w-11 shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-muted">{lesson.description}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.cls}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {t(meta.labelKey)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/learn/${lesson.id}`}
                  className="btn-primary inline-flex min-h-11 items-center gap-2 text-sm"
                >
                  <GraduationCap aria-hidden="true" className="h-4 w-4" />
                  {t('learn.index.learn')}
                </Link>
                <Link
                  href={`/learn/practice?lesson=${lesson.id}`}
                  className="btn-secondary inline-flex min-h-11 items-center gap-2 text-sm"
                >
                  <Dumbbell aria-hidden="true" className="h-4 w-4" />
                  {t('learn.index.practice')}
                </Link>
                <Link
                  href={`/learn/quiz?lesson=${lesson.id}`}
                  className="btn-secondary inline-flex min-h-11 items-center text-sm"
                >
                  {t('learn.index.quiz')}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm text-ink">
        <span>{label}</span>
        <span className="text-muted">
          {value} / {max}
        </span>
      </div>
      <div
        className="mt-1 h-3 overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-aurora" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
