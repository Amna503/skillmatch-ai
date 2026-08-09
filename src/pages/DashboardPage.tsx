import { useState, useEffect, useRef, useCallback } from "react";
import {
  uploadResume,
  listResumes,
  deleteResume,
  createJobDescription,
  listJobDescriptions,
  runMatch,
  getRecommendedJobs,
  type ResumeUploadResult,
  type JobDescription,
  type MatchResult,
  type RecommendedJob,
} from "../lib/api";
import {
  Upload,
  FileText,
  Briefcase,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  AlertCircle,
  Target,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  Search,
  Trash2,
  Plus,
} from "lucide-react";

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

const UPLOAD_MESSAGES = [
  "Reading your resume…",
  "Extracting text…",
  "Analyzing skills…",
  "Almost done…",
];

/* ────────────────────────────────────────────
   Animated Score Ring
   ──────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  const ringColor =
    score >= 75
      ? "stroke-success"
      : score >= 40
        ? "stroke-warning"
        : "stroke-destructive";

  const textColor =
    score >= 75
      ? "text-success"
      : score >= 40
        ? "text-warning"
        : "text-destructive";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Match score: ${score}%`}
    >
      <svg width="140" height="140" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border opacity-30"
          strokeWidth="10"
        />
        {/* Foreground circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          className={`${ringColor} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={`absolute text-3xl font-extrabold ${textColor}`}>
        {score}%
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────
   DashboardPage
   ──────────────────────────────────────────── */
export default function DashboardPage() {
  // ── State ──
  const [resumes, setResumes] = useState<ResumeUploadResult[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsgIndex, setUploadMsgIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMsgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Job form state
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobSaving, setJobSaving] = useState(false);

  // Job search
  const [jobSearch, setJobSearch] = useState("");

  // Feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Recommended jobs state
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [recommending, setRecommending] = useState(false);

  // Skeleton loading for initial data
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Load data on mount ──
  useEffect(() => {
    Promise.all([loadResumes(), loadJobs()]).finally(() => setInitialLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rotate upload messages ──
  useEffect(() => {
    if (uploading) {
      uploadMsgTimerRef.current = setInterval(() => {
        setUploadMsgIndex((prev) => (prev + 1) % UPLOAD_MESSAGES.length);
      }, 2500);
    } else {
      if (uploadMsgTimerRef.current) {
        clearInterval(uploadMsgTimerRef.current);
        uploadMsgTimerRef.current = null;
      }
      setUploadMsgIndex(0);
    }
    return () => {
      if (uploadMsgTimerRef.current) clearInterval(uploadMsgTimerRef.current);
    };
  }, [uploading]);

  // ── Fetch recommended jobs when resume changes ──
  useEffect(() => {
    if (!selectedResumeId) {
      setRecommendedJobs([]);
      return;
    }
    setRecommending(true);
    getRecommendedJobs(selectedResumeId)
      .then(setRecommendedJobs)
      .catch(() => setRecommendedJobs([]))
      .finally(() => setRecommending(false));
  }, [selectedResumeId]);

  async function loadResumes() {
    try {
      const data = await listResumes();
      setResumes(data ?? []);
    } catch {
      // non‑critical
    }
  }

  async function loadJobs() {
    try {
      const data = await listJobDescriptions();
      setJobs(data ?? []);
    } catch {
      // non‑critical
    }
  }

  // ── Shared upload logic ──
  const uploadFile = useCallback(async (file: File) => {
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const result = await uploadResume(file);
      setResumes((prev) => [result, ...prev]);
      setSelectedResumeId(result.id);
      setSuccess("Resume uploaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  // ── Handlers ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type client-side for immediate feedback
    const allowed = [".pdf", ".docx", ".doc", ".txt", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(file.type) && !allowed.includes(ext)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    await uploadFile(file);
  }, [uploadFile]);

  // ── Delete resume ──
  const handleDeleteResume = useCallback(
    async (e: React.MouseEvent, resumeId: string) => {
      e.stopPropagation();
      if (!confirm("Remove this resume?")) return;
      setError("");
      setSuccess("");
      try {
        await deleteResume(resumeId);
        setResumes((prev) => prev.filter((r) => r.id !== resumeId));
        if (selectedResumeId === resumeId) {
          setSelectedResumeId("");
          setMatchResult(null);
        }
        setSuccess("Resume removed.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete.");
      }
    },
    [selectedResumeId],
  );

  const handleSelectRecommended = (jobId: string) => {
    setSelectedJobId(jobId);
    setMatchResult(null);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDesc.trim()) return;
    setError("");
    setSuccess("");
    setJobSaving(true);
    try {
      const job = await createJobDescription({
        title: jobTitle.trim() || undefined,
        company: jobCompany.trim() || undefined,
        description_text: jobDesc,
      });
      setJobs((prev) => [job, ...prev]);
      setSelectedJobId(job.id);
      setJobTitle("");
      setJobCompany("");
      setJobDesc("");
      setShowJobForm(false);
      setSuccess("Job description saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job.");
    } finally {
      setJobSaving(false);
    }
  };

  const handleRunMatch = async () => {
    if (!selectedResumeId || !selectedJobId) return;
    setError("");
    setSuccess("");
    setMatchResult(null);
    setMatchLoading(true);
    try {
      const result = await runMatch(selectedResumeId, selectedJobId);
      setMatchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed.");
    } finally {
      setMatchLoading(false);
    }
  };

  // ── Derived ──
  const canMatch = !!selectedResumeId && !!selectedJobId && !matchLoading;
  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const filteredJobs = jobSearch.trim()
    ? jobs.filter(
        (j) =>
          (j.title ?? "").toLowerCase().includes(jobSearch.toLowerCase()) ||
          (j.company ?? "").toLowerCase().includes(jobSearch.toLowerCase()),
      )
    : jobs;

  // ── Render ──
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a resume, paste a job description, and let AI find the perfect match.
        </p>
      </div>

      {/* ── Feedback toasts ── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg bg-error-bg border border-destructive/30 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-destructive/70 hover:text-destructive cursor-pointer">
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 rounded-lg bg-success-bg border border-success/30 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto text-success/70 hover:text-success cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {initialLoading ? (
        /* ── Skeleton loading ── */
        <div className="space-y-4">
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════ */}
          {/* SECTION 1 — Resume                  */}
          {/* ════════════════════════════════════ */}
          <section className="card-base">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Resume
              </h2>
              <label className="btn-primary text-xs cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Upload"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-150 ${
                dragOver
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border hover:border-primary/40 hover:bg-muted-bg/30"
              } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              {/* Hidden file input for click-to-upload inside drop zone */}
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span
                    className="block text-sm text-muted transition-all duration-300"
                    key={uploadMsgIndex}
                  >
                    {UPLOAD_MESSAGES[uploadMsgIndex]}
                  </span>
                </div>
              ) : dragOver ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-primary">Drop your file here</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted opacity-40" />
                  <p className="text-sm text-muted">
                    <span className="text-primary underline decoration-primary/30 underline-offset-2 cursor-pointer">Click to upload</span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-muted opacity-60">PDF, DOCX, or TXT (max 5 MB)</p>
                </div>
              )}
            </div>

            {/* Resume list */}
            {resumes.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Uploaded resumes</p>
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all duration-150 ${
                      selectedResumeId === r.id
                        ? "border-primary bg-primary/5 shadow-glow"
                        : "border-border bg-transparent hover:bg-card-hover"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedResumeId(r.id)}
                      className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer"
                    >
                      <FileText
                        className={`h-5 w-5 shrink-0 ${
                          selectedResumeId === r.id ? "text-primary" : "text-muted"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {r.file_name}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(r.created_at)} &middot; {(r.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {selectedResumeId === r.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                    {/* Remove button */}
                    <button
                      onClick={(e) => handleDeleteResume(e, r.id)}
                      className="shrink-0 rounded-md p-2 text-muted hover:text-destructive hover:bg-error-bg transition-all duration-150 cursor-pointer"
                      title="Remove resume"
                      aria-label={`Remove ${r.file_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ════════════════════════════════════ */}
          {/* SECTION 2 — Job Description          */}
          {/* ════════════════════════════════════ */}
          <section className="card-base">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Briefcase className="h-5 w-5 text-primary" />
                Job Description
              </h2>
              <button onClick={() => setShowJobForm(!showJobForm)} className="btn-primary text-xs">
                {showJobForm ? "Cancel" : "+ New"}
              </button>
            </div>

            {/* Job search filter */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="input-field pl-9 pr-8 text-sm"
                placeholder="Search saved job descriptions…"
                aria-label="Search job descriptions"
              />
              {jobSearch && (
                <button
                  onClick={() => setJobSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Job form */}
            {showJobForm && (
              <form onSubmit={handleSaveJob} className="mb-4 space-y-3 rounded-lg bg-muted-bg/50 p-4 border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                      Job title <span className="opacity-50">(optional)</span>
                    </label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">
                      Company <span className="opacity-50">(optional)</span>
                    </label>
                    <input
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Job description *</label>
                  <textarea
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    className="input-field textarea-field text-sm"
                    rows={6}
                    placeholder="Paste the full job description here…"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={jobSaving || !jobDesc.trim()}
                    className="btn-primary text-xs min-h-[44px]"
                  >
                    {jobSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="h-3.5 w-3.5" />
                        Save job description
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Job list */}
            {jobs.length === 0 && !showJobForm ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted">
                <Briefcase className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No job descriptions yet.</p>
                <p className="text-xs opacity-60">
                  Click &ldquo;+ New&rdquo; above to add your first job description.
                </p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted">
                <Search className="h-6 w-6 opacity-40" />
                <p className="text-sm">No jobs match &ldquo;{jobSearch}&rdquo;</p>
              </div>
            ) : (
              !showJobForm && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredJobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => {
                        setSelectedJobId(j.id);
                        setMatchResult(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-150 cursor-pointer ${
                        selectedJobId === j.id
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border bg-transparent hover:bg-card-hover"
                      }`}
                    >
                      <Briefcase
                        className={`h-5 w-5 shrink-0 ${
                          selectedJobId === j.id ? "text-primary" : "text-muted"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {j.title || "Untitled position"}
                          {j.company ? (
                            <span className="text-muted"> &middot; {j.company}</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">{formatDate(j.created_at)}</p>
                      </div>
                      {selectedJobId === j.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )
            )}
          </section>

          {/* ════════════════════════════════════ */}
          {/* SECTION 3 — Match Now (CTA)         */}
          {/* ════════════════════════════════════ */}
          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-glow">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {selectedResumeId && selectedJobId
                  ? "Ready to go — click below to see your match!"
                  : !selectedResumeId && !selectedJobId
                    ? "Upload a resume and select a job to get started"
                    : !selectedResumeId
                      ? "Upload a resume first"
                      : "Select a job description above"}
              </p>
            </div>
            <button
              onClick={handleRunMatch}
              disabled={!canMatch}
              className="btn-primary text-base px-10 py-3 min-h-[52px]"
            >
              {matchLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Matching…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Match Now
                </span>
              )}
            </button>
          </div>

          {/* ════════════════════════════════════ */}
          {/* SECTION 4 — Recommended for You    */}
          {/* ════════════════════════════════════ */}
          {selectedResumeId && !matchResult && (
            <section className="card-base">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
                {recommending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
              </div>

              {recommending ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Finding the best matches…</p>
                </div>
              ) : recommendedJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted">
                  <TrendingUp className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No recommendations yet.</p>
                  <p className="text-xs opacity-60">
                    Add more job descriptions to get personalized recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSelectRecommended(job.id)}
                      className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all duration-150 cursor-pointer ${
                        selectedJobId === job.id
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border bg-transparent hover:bg-card-hover"
                      }`}
                    >
                      {/* Score badge */}
                      <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                        job.matchScore >= 70
                          ? "bg-success/15 text-success"
                          : job.matchScore >= 40
                            ? "bg-warning/15 text-warning"
                            : "bg-error-bg text-destructive"
                      }`}>
                        {job.matchScore}%
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {job.title || "Untitled position"}
                          {job.company ? <span className="text-muted"> &middot; {job.company}</span> : null}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {job.matchedSkills.length} skills match
                          {job.missingSkills.length > 0
                            ? ` · ${job.missingSkills.length} to improve`
                            : ""}
                        </p>
                        {job.matchedSkills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.matchedSkills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
                              >
                                {s}
                              </span>
                            ))}
                            {job.matchedSkills.length > 4 && (
                              <span className="inline-flex items-center text-[10px] text-muted">
                                +{job.matchedSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedJobId === job.id && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ════════════════════════════════════ */}
          {/* SECTION 5 — Match Results           */}
          {/* ════════════════════════════════════ */}
          {matchResult && <MatchResultsSection result={matchResult} />}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   MatchResultsSection
   ──────────────────────────────────────────── */
function MatchResultsSection({ result }: { result: MatchResult }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="card-base !border-primary/30 !shadow-glow">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between cursor-pointer"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Match Results
        </h2>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted" /> : <ChevronDown className="h-5 w-5 text-muted" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-6">
          {/* ═══ Score ring + summary ═══ */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <ScoreRing score={result.matchScore} />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-lg font-bold text-foreground">
                {result.matchScore >= 75
                  ? "Strong Match!"
                  : result.matchScore >= 40
                    ? "Moderate Match"
                    : "Low Match"}
              </p>
              {result.summary && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Skills grid ═══ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Matched */}
            <div className="rounded-lg bg-success-bg border border-success/20 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-success mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Skills You Have ({result.matchedSkills.length})
              </h3>
              {result.matchedSkills.length === 0 ? (
                <p className="text-xs text-muted">No matched skills found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Missing */}
            <div className="rounded-lg bg-warning-bg border border-warning/20 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-warning mb-3">
                <XCircle className="h-4 w-4" />
                Skills You&apos;re Missing ({result.missingSkills.length})
              </h3>
              {result.missingSkills.length === 0 ? (
                <p className="text-xs text-muted">No missing skills — perfect match!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ Recommendations ═══ */}
          {result.summary && (
            <div className="rounded-lg border border-border bg-muted-bg/50 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Recommendations
              </h3>
              <p className="text-sm text-muted leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* ═══ Meta ═══ */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Analysed {result.created_at ? formatDate(result.created_at) : "just now"}
          </div>
        </div>
      )}
    </section>
  );
}