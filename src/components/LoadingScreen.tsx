import { useEffect, useState } from "react";
import Logo from "./Logo";

/**
 * Returns `true` for `duration` ms after the component mounts, then `false`.
 *
 * This powers the branded page-load splash. It is intentionally separate from
 * action-loading states (uploading, matching, saving…) — those keep their own
 * inline spinners — and only runs on full page loads / refreshes / first
 * navigation to a page.
 */
export function usePageSplash(duration = 5000): boolean {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);
  return show;
}

interface LoadingScreenProps {
  /** Whether the splash should be visible. Toggle to false to fade it out. */
  show: boolean;
}

/**
 * Full-screen branded loader shown on page load/refresh: centered logo mark
 * with a subtle spinning ring + pulse, and the SkillMatch AI wordmark.
 *
 * Fades out (ease-in exit) when `show` flips to false and stops intercepting
 * pointer events so the real page underneath is revealed.
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
      {/* Logo mark with spinning ring */}
      <div className="splash-rise relative flex h-24 w-24 items-center justify-center">
        <span className="splash-ring absolute inset-0 rounded-full border-2 border-border motion-reduce:animate-none" />
        <span className="splash-ring absolute inset-0 rounded-full border-2 border-transparent border-t-primary motion-reduce:animate-none" />
        <div className="dot-pulse flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to shadow-glow motion-reduce:animate-none">
          <Logo className="h-8 w-8 text-on-primary" />
        </div>
      </div>

      {/* Wordmark */}
      <h1 className="splash-rise mt-6 font-heading text-2xl font-extrabold tracking-tight text-heading motion-reduce:animate-none">
        SkillMatch AI
      </h1>
      <p
        className="splash-rise mt-1.5 text-sm text-muted motion-reduce:animate-none"
        style={{ animationDelay: "150ms" }}
      >
        Preparing your experience…
      </p>
      <span className="sr-only">Loading SkillMatch AI</span>
    </div>
  );
}
