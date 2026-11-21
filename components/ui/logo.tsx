import { cn } from "@/lib/utils";

type LogoProps = { size?: number; className?: string };

/**
 * The ReadLedger mark: four spines on a shelf that doubles as a bar chart,
 * standing on the bookkeeper's double rule. Same artwork as app/icon.svg.
 */
export function LogoMark({ size = 24, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="7" fill="#f4efe4" />
      <rect x="5" y="11" width="5" height="13.6" rx="1" fill="#1f4a3a" />
      <rect x="11" y="6" width="5" height="18.6" rx="1" fill="#7b2d26" />
      <rect x="17" y="9" width="5" height="15.6" rx="1" fill="#1d1b18" />
      <rect
        x="23.2"
        y="9.2"
        width="4.6"
        height="15"
        rx="1"
        fill="#c9a24a"
        transform="rotate(14 25.5 24.6)"
      />
      <rect x="4" y="25" width="24" height="1.3" fill="#1d1b18" />
      <rect x="4" y="27.3" width="24" height="1.3" fill="#1d1b18" />
    </svg>
  );
}

/** Mark plus the serif wordmark. */
export function Logo({ size = 24, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-serif text-[1.2rem] font-semibold tracking-[-0.01em] leading-none">
        ReadLedger
      </span>
    </span>
  );
}
