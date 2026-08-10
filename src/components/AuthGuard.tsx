import { useEffect, useState, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sparkles } from "lucide-react";

interface Props {
  children: ReactNode;
}

const SESSION_TIMEOUT_MS = 10_000; // 10s safety net

export default function AuthGuard({ children }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if getSession hangs longer than SESSION_TIMEOUT_MS,
    // treat as unauthenticated so the user isn't stuck on a blank loading page.
    timeoutRef.current = setTimeout(() => {
      if (!mounted) return;
      console.warn("[AuthGuard] Session check timed out — redirecting to login.");
      setStatus("unauthenticated");
      navigate("/login", { replace: true });
    }, SESSION_TIMEOUT_MS);

    // Primary session check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        clearTimeout(timeoutRef.current);
        if (session) {
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
          navigate("/login", { replace: true });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        clearTimeout(timeoutRef.current);
        console.error("[AuthGuard] getSession error:", err);
        // Fail-open: even if getSession threw, the user might still be logged in.
        // Try getUser() as a fallback before redirecting.
        supabase.auth.getUser()
          .then(({ data: { user } }) => {
            if (!mounted) return;
            if (user) {
              setStatus("authenticated");
            } else {
              setStatus("unauthenticated");
              navigate("/login", { replace: true });
            }
          })
          .catch(() => {
            if (!mounted) return;
            setStatus("unauthenticated");
            navigate("/login", { replace: true });
          });
      });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      clearTimeout(timeoutRef.current);
      if (session) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutRef.current);
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to shadow-glow animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}