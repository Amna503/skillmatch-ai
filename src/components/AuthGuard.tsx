import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sparkles } from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        navigate("/login", { replace: true });
      }
    });

    return () => listener?.subscription.unsubscribe();
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