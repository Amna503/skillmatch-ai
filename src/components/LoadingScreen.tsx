import { useState, useEffect, useCallback } from "react";
import Logo from "./Logo";

/**
 * Hook that manages a per-page loading state.
 *
 * - `loading` starts as `true` and flips to `false` when `markLoaded()` is called
 *   OR after a safety fallback of 4 seconds — whichever comes first.
 * - This guarantees the loading overlay can NEVER stay visible forever.
 *
 * Call `markLoaded()` once your actual data fetching finishes (or fails).
 */
export function usePageLoader(): { loading: boolean; markLoaded: () => void } {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety fallback – force‑hide after 4 s no matter what.
    const fallback = window.setTimeout(() => setLoading(false), 4000);
    return () => window.clearTimeout(fallback);
  }, []);

  const markLoaded = useCallback(() => setLoading(false), []);
  return { loading, markLoaded };
}

interface LoadingScreenProps {
  /** Whether the splash should be visible. */
  show: boolean;
}

/**
 * Full-screen branded loader: centered logo mark with a subtle pulse.
 * Fades out (ease-in exit) when `show` flips to false and stops
 * intercepting pointer events so the real page underneath is revealed.
 */
export default function LoadingScreen({ show }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!show}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-page transition-opacity duration-500 ease-in ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Logo mark with pulsing ring */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-border motion-reduce:animate-none" />
        <span className="splash-ring absolute inset-0 rounded-full border-2 border-transparent border-t-primary motion-reduce:animate-none" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to shadow-glow motion-reduce:animate-none">
          <Logo className="h-8 w-8 text-on-primary" />
        </div>
      </div>
      <span className="sr-only">Loading SkillMatch AI</span>
    </div>
  );
}