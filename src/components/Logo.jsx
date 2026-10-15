export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="rgb(var(--brand))" />
        <rect x="6" y="6" width="9" height="13" rx="2.5" fill="rgb(var(--brand-ink))" />
        <rect x="17" y="6" width="9" height="7" rx="2.5" fill="rgb(var(--sun))" />
        <rect x="17" y="15" width="9" height="11" rx="2.5" fill="rgb(var(--brand-ink))" />
        <rect x="6" y="21" width="9" height="5" rx="2.5" fill="rgb(var(--sun))" />
      </svg>
      <span className="font-display text-2xl font-bold tracking-tight">Mosaico</span>
    </span>
  );
}
