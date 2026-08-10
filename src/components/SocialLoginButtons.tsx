import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { signInWithOAuth } from "../lib/api";

type Provider = "google" | "github" | "apple";

/* ── Official brand SVG marks (inline so no extra dependency is needed) ── */

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

/* ── Button definitions ── */

const PROVIDERS: {
  id: Provider;
  label: string;
  Icon: typeof GoogleIcon;
  base: string; // button chrome
  iconClass: string;
}[] = [
  {
    id: "google",
    label: "Continue with Google",
    Icon: GoogleIcon,
    base: "bg-white text-[#1f1f1f] border border-black/10 hover:bg-neutral-50 hover:border-black/20 focus-visible:ring-primary/40",
    iconClass: "h-5 w-5",
  },
  {
    id: "github",
    label: "Continue with GitHub",
    Icon: GitHubIcon,
    base: "bg-[#1b1f23] text-white border border-transparent hover:bg-[#24292f] focus-visible:ring-white/30",
    iconClass: "h-5 w-5",
  },
  {
    id: "apple",
    label: "Continue with Apple",
    Icon: AppleIcon,
    base: "bg-[#000000] text-white border border-transparent hover:bg-[#1c1c1e] focus-visible:ring-white/30",
    iconClass: "h-5 w-5",
  },
];

/* ── Friendly error mapping ── */

function friendlyOAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("provider is not enabled") ||
    m.includes("not enabled") ||
    m.includes("no provider") ||
    m.includes("unsupported provider")
  ) {
    return "That sign-in option isn't switched on yet. Please try again in a moment, or use email to log in.";
  }
  if (m.includes("popup") && (m.includes("closed") || m.includes("cancel"))) {
    return "Sign-in was cancelled — no worries, you can try again whenever you're ready.";
  }
  if (m.includes("redirect") && (m.includes("blocked") || m.includes("denied") || m.includes("error"))) {
    return "The sign-in window didn't open. Please allow pop-ups for this site and try again.";
  }
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch")) {
    return "We couldn't reach the sign-in service. Check your connection and try again.";
  }
  return message;
}

/* ── Component ── */

export default function SocialLoginButtons() {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  const handleSignIn = async (provider: Provider) => {
    if (busy) return;
    setError("");
    setBusy(provider);
    try {
      // On success the implicit OAuth flow redirects the whole page back to "/",
      // where AuthGuard picks up the new session — no manual navigation needed.
      await signInWithOAuth(provider);
    } catch (err) {
      setError(friendlyOAuthError(err instanceof Error ? err.message : ""));
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, label, Icon, base, iconClass }) => (
        <button
          key={id}
          type="button"
          onClick={() => handleSignIn(id)}
          disabled={busy !== null}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer ${base}`}
        >
          {busy === id ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className={iconClass} />
          )}
          {busy === id ? "Redirecting…" : label}
        </button>
      ))}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-error-bg px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
