interface SpinnerProps {
  /** Tailwind size classes for the spinner; defaults to h-5 w-5. */
  className?: string;
}

/**
 * Small indeterminate loading spinner built from Tailwind utilities.
 */
export function Spinner({ className = "h-5 w-5" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${className}`}
    />
  );
}
