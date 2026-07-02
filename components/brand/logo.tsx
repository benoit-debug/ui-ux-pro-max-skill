import { cn } from "@/lib/utils";

// Vitals wordmark: an ECG/heartbeat glyph (the "vitals" cue) + the name.
// The glyph uses the accent color; the wordmark uses foreground ink.
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PulseGlyph />
      {showWordmark && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          Vitals
        </span>
      )}
    </span>
  );
}

export function PulseGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <path
        d="M2 12h4l2.5-6 3.5 12 2.5-6H22"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
