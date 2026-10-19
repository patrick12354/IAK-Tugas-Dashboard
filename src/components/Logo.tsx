/** Logo: tiga batang naik di dalam kotak, "grafik perbankan" yang sederhana. */
export function LogoMark({ className = "size-7", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ${inverted ? "bg-white text-black" : "bg-primary text-primary-ink"} ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="size-[55%]" fill="currentColor">
        <rect x="1.5" y="9" width="3" height="5.5" rx="1" />
        <rect x="6.5" y="5.5" width="3" height="9" rx="1" />
        <rect x="11.5" y="1.5" width="3" height="13" rx="1" />
      </svg>
    </span>
  );
}
