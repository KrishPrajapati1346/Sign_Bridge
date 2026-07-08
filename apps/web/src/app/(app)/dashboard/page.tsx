'use client';

import Link from 'next/link';
import {
  Mic,
  Hand,
  Users,
  Languages,
  PersonStanding,
  GraduationCap,
  Siren,
  Video,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n/use-translation';
import { PageHeader } from '@/components/PageHeader';
import { FeatureCard } from '@/components/FeatureCard';

const MODULES: { icon: LucideIcon; titleKey: string; descKey: string; href: string }[] = [
  { icon: Users, titleKey: 'nav.live', descKey: 'dash.card.live.desc', href: '/live' },
  { icon: Mic, titleKey: 'nav.speech', descKey: 'dash.card.speech.desc', href: '/speech' },
  { icon: Hand, titleKey: 'nav.sign', descKey: 'dash.card.sign.desc', href: '/sign' },
  {
    icon: Languages,
    titleKey: 'nav.translate',
    descKey: 'dash.card.translate.desc',
    href: '/translate',
  },
  {
    icon: Languages,
    titleKey: 'nav.document',
    descKey: 'dash.card.document.desc',
    href: '/translate/document',
  },
  {
    icon: PersonStanding,
    titleKey: 'nav.avatar',
    descKey: 'dash.card.avatar.desc',
    href: '/avatar',
  },
  { icon: GraduationCap, titleKey: 'nav.learn', descKey: 'dash.card.learn.desc', href: '/learn' },
  {
    icon: Siren,
    titleKey: 'nav.emergency',
    descKey: 'dash.card.emergency.desc',
    href: '/emergency',
  },
  { icon: Video, titleKey: 'nav.call', descKey: 'dash.card.video.desc', href: '/call' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useT();
  const firstName = user?.name?.split(' ')[0];

  return (
    <div>
      <PageHeader
        title={firstName ? t('dash.welcomeName', { name: firstName }) : t('dash.welcome')}
        context={t('dash.intro')}
      />

      <StartConversationHero />

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2
          id="modules-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted"
        >
          {t('dash.modules')}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[250px]">
          {MODULES.map((m, idx) => (
            <div key={m.href} className={idx === 0 || idx === 3 ? 'lg:col-span-2' : ''}>
              <FeatureCard
                icon={m.icon}
                title={t(m.titleKey)}
                description={t(m.descKey)}
                href={m.href}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * The signature element: a single prominent card for the product's core job.
 * A restrained two-channel "bridge" motif suggests two people / modalities
 * meeting. The action is not yet wired (Conversation lands in a later phase),
 * so it is clearly marked rather than linking nowhere.
 */
function StartConversationHero() {
  const t = useT();
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface/60 backdrop-blur-3xl px-8 py-10 sm:px-12 sm:py-16 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-30 mix-blend-screen" />
      <BridgeMotif />
      <div className="relative z-10 max-w-xl animate-fade-up">
        <span className="chip mb-6">
          {t('dash.hero.kicker')}
        </span>
        <h2 id="hero-heading" className="mt-4 font-display text-4xl font-bold sm:text-5xl text-ink">
          {t('dash.hero.title')}
        </h2>
        <p className="mt-4 max-w-md text-lg text-muted font-medium">{t('dash.hero.body')}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/live"
            className="btn-primary"
          >
            {t('dash.hero.cta')}
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Decorative two-channel bridge lines. Motion is handled globally via the
 *  reduced-motion rules; this is static and purely decorative. */
function BridgeMotif() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 200"
      className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20"
      fill="none"
      stroke="currentColor"
    >
      <path d="M0 70 H400" strokeWidth="2" className="text-bridge" />
      <path d="M0 130 H400" strokeWidth="2" className="text-signal" />
      <circle cx="120" cy="70" r="6" className="fill-bridge" stroke="none" />
      <circle cx="280" cy="130" r="6" className="fill-signal" stroke="none" />
      <path d="M120 70 C 180 70, 220 130, 280 130" strokeWidth="2" className="text-canvas" />
    </svg>
  );
}
