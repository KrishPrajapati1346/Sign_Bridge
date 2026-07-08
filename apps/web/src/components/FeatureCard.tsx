import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

/**
 * A dashboard module card. When `href` is set the card links to a live feature;
 * when `comingSoon` is set it is non-navigating (the real feature lands in a
 * later phase) and clearly badged, so there are no dead links.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  comingSoon = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}) {
  const body = (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-6">
        <span className="icon-tile h-14 w-14 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 bg-gradient-to-br from-signal/20 to-iris/20 text-signal shadow-[0_0_15px_rgba(0,112,243,0.2)]">
          <Icon aria-hidden="true" className="h-7 w-7" />
        </span>
        {comingSoon && (
          <span className="rounded-full border border-white/20 bg-surface/50 backdrop-blur-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            Coming soon
          </span>
        )}
        {href && !comingSoon && (
          <ArrowRight
            aria-hidden="true"
            className="h-6 w-6 text-muted/40 transition-all duration-300 group-hover:translate-x-2 group-hover:text-signal"
          />
        )}
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-ink mb-2 group-hover:text-signal transition-colors">{title}</h3>
        <p className="text-[15px] font-medium text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} className="card card-hover group flex h-full flex-col p-8">
        {body}
      </Link>
    );
  }

  return (
    <div className="card group flex h-full flex-col p-8 opacity-70 grayscale-[0.5]">
      {body}
    </div>
  );
}
