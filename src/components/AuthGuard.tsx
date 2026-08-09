import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Brain } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}