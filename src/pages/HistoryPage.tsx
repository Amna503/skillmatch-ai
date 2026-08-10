import { useState, useEffect } from "react";
import { getMatchHistory, type MatchResult } from "../lib/api";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import LoadingScreen, { usePageLoader } from "../components/LoadingScreen";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function scoreColor(score: number) {
  if (score >= 80) return "text-success bg-success-bg";
  if (score >= 50) return "text-warning bg-warning-bg";
  return "text-destructive bg-error-bg";
}

/* ────────────────────────────────────────────
   HistoryPage
   ──────────────────────────────────────────── */
export default function HistoryPage() {
  const { loading: showSplash, markLoaded } = usePageLoader();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError("");
    try {
      const data = await getMatchHistory();
      setMatches(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
      markLoaded();
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <>
        <LoadingScreen show={showSplash} />
        <div className={`relative transition-opacity duration-500 ease-out ${showSplash ? "opacity-0" : "opacity-100"}`}>
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton mt-2 h-4 w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton mb-3 h-20 w-full rounded-xl" />
        ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LoadingScreen show={showSplash} />
      <div className={`relative transition-opacity duration-500 ease-out ${showSplash ? "opacity-0" : "opacity-100"}`}>
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Heading */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-heading sm:text-3xl">
          <BarChart3 className="h-7 w-7 text-primary" />
          Match History
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review all your past resume‑to‑job matches.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-error-bg border border-destructive/30 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-destructive/70 hover:text-destructive cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && matches.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <BarChart3 className="h-12 w-12 opacity-30" />
          <p className="text-base font-medium">No match history yet</p>
          <p className="text-sm opacity-60">
            Head over to the Dashboard to run your first match.
          </p>
        </div>
      )}

      {/* Match list */}
      <div className="space-y-3">
        {matches.map((m) => {
          const isOpen = expandedId === m.id;
          return (
            <div
              key={m.id}
              className="card-base overflow-hidden"
            >
              {/* Row header (always visible) */}
              <button
                onClick={() => toggleExpand(m.id)}
                className="flex w-full items-center gap-4 text-left cursor-pointer"
              >
                {/* Score badge */}
                <span className={`badge-score shrink-0 ${scoreColor(m.matchScore)}`}>
                  {m.matchScore}%
                </span>

                {/* Resume & Job info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.resume?.file_name ?? "Unknown resume"}
                    <span className="text-muted"> vs </span>
                    {m.job?.title ?? "Untitled job"}
                    {m.job?.company ? <span className="text-muted"> &middot; {m.job.company}</span> : null}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(m.created_at)}
                  </p>
                </div>

                {/* Expand indicator */}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                )}
              </button>

              {/* Expanded detail panel */}
              {isOpen && (
                <div className="mt-4 border-t border-border pt-4 space-y-4">
                  {/* Skills grids */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Matched */}
                    <div className="rounded-lg bg-success-bg border border-success/20 p-3">
                      <p className="text-xs font-semibold text-success mb-2">
                        Matched Skills ({m.matchedSkills.length})
                      </p>
                      {m.matchedSkills.length === 0 ? (
                        <p className="text-xs text-muted">None</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.matchedSkills.map((s) => (
                            <span
                              key={s}
                              className="inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Missing */}
                    <div className="rounded-lg bg-warning-bg border border-warning/20 p-3">
                      <p className="text-xs font-semibold text-warning mb-2">
                        Missing Skills ({m.missingSkills.length})
                      </p>
                      {m.missingSkills.length === 0 ? (
                        <p className="text-xs text-muted">None — perfect match</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.missingSkills.map((s) => (
                            <span
                              key={s}
                              className="inline-flex rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {m.summary && (
                    <div className="rounded-lg border border-border bg-muted-bg/50 p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">Recommendations</p>
                      <p className="text-sm text-muted leading-relaxed">{m.summary}</p>
                    </div>
                  )}

                  {/* Resume & Job IDs */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Resume: {m.resume?.id ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Job: {m.job?.id ?? "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {matches.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted">
          {matches.length} match{matches.length !== 1 ? "es" : ""} total
        </p>
      )}
        </div>
      </div>
    </>
  );
}