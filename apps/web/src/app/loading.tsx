export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
      <div className="relative flex flex-col items-center">
        {/* Glowing backdrop effect */}
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-blue-500/20 blur-2xl" />
        
        {/* Pulsing Logo */}
        <img 
          src="/logo.png" 
          alt="Loading SignBridge..." 
          className="w-16 h-16 rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse object-cover"
        />
        
        {/* Loading text with animated ellipsis */}
        <div className="mt-8 flex items-center gap-1 font-display text-sm font-bold tracking-widest text-muted uppercase">
          Loading
          <span className="flex gap-0.5">
            <span className="animate-bounce inline-block" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce inline-block" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce inline-block" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
