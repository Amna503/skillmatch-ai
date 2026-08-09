import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function StatusPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<
    "checking" | "ok" | "error"
  >("checking");
  const [supabaseMsg, setSupabaseMsg] = useState("Checking...");

  useEffect(() => {
    // Quick Supabase connectivity check
    supabase
      .from("_unused_check")
      .select("*", { count: "exact", head: true })
      .then(({ error }) => {
        if (error && error.code === "PGRST116") {
          // Table doesn't exist but we connected — that's fine
          setSupabaseStatus("ok");
          setSupabaseMsg("Connected (table not found — as expected)");
        } else if (error) {
          setSupabaseStatus("error");
          setSupabaseMsg(error.message);
        } else {
          setSupabaseStatus("ok");
          setSupabaseMsg("Connected");
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">🚦 SkillMatch AI</h1>
          <p className="mt-2 text-muted">Status Dashboard</p>
        </div>

        {/* Environment info */}
        <div className="card-base mb-4">
          <h2 className="mb-3 text-lg font-semibold">Environment</h2>
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Node", navigator.userAgent.includes("Node") ? "Yes" : "No"],
                ["React", React.version],
                ["Mode", import.meta.env.MODE],
                ["Base URL", import.meta.env.BASE_URL],
                ["Supabase URL", import.meta.env.VITE_SUPABASE_URL || "(set via lib)"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-border last:border-0">
                  <td className="py-2 font-medium text-muted w-32">{k}</td>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Supabase status */}
        <div className="card-base mb-4">
          <h2 className="mb-3 text-lg font-semibold">Supabase</h2>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                supabaseStatus === "checking"
                  ? "bg-yellow-400 animate-pulse"
                  : supabaseStatus === "ok"
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />
            <span className="text-sm">{supabaseMsg}</span>
          </div>
        </div>

        {/* Route links */}
        <div className="card-base mb-4">
          <h2 className="mb-3 text-lg font-semibold">Routes</h2>
          <div className="space-y-2 text-sm">
            <a href="/" className="btn-primary inline-flex">/ (Dashboard — requires login)</a>
            <a href="/login" className="btn-secondary inline-flex ml-2">/login</a>
            <a href="/signup" className="btn-secondary inline-flex ml-2">/signup</a>
            <a href="/history" className="btn-secondary inline-flex ml-2">/history (requires login)</a>
          </div>
        </div>

        {/* CSS utility visual check */}
        <div className="card-base">
          <h2 className="mb-3 text-lg font-semibold">Visual Check</h2>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary">btn-primary</button>
              <button className="btn-secondary">btn-secondary</button>
              <button className="btn-destructive">btn-destructive</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="badge-score bg-success-bg text-success">Match 92%</span>
              <span className="badge-score bg-warning-bg text-warning">Match 68%</span>
              <span className="badge-score bg-error-bg text-destructive">Match 34%</span>
            </div>
            <div>
              <input className="input-field" placeholder="input-field" readOnly />
            </div>
            <div>
              <textarea className="textarea-field" placeholder="textarea-field" readOnly />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}