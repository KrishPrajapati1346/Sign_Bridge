/** Consistent page title + short context line used across the app shell. */
export function PageHeader({ title, context, children }: { title: string; context?: string; children?: React.ReactNode }) {
  return (
    <header className="relative mb-8 animate-fade-up flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        {/* Decorative aurora accent bar */}
        <span
          aria-hidden="true"
          className="absolute -left-4 top-1.5 hidden h-9 w-1.5 rounded-full bg-aurora sm:block"
        />
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {context && <p className="mt-2 max-w-prose text-muted">{context}</p>}
      </div>
      {children && <div>{children}</div>}
    </header>
  );
}
