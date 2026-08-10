import { useState, useEffect, useRef, useCallback } from "react";
import {
  uploadResume, listResumes, deleteResume, createJobDescription,
  listJobDescriptions, runMatch, getRecommendedJobs,
  fetchJobFromUrl, extractJobFromImage,
  type ResumeUploadResult, type JobDescription, type MatchResult, type RecommendedJob,
} from "../lib/api";
import {
  Upload, FileText, Briefcase, Sparkles, CheckCircle2, XCircle,
  Lightbulb, Loader2, AlertCircle, Target, ChevronDown, ChevronUp,
  Clock, TrendingUp, Trash2, Link, Image, ScrollText, Zap,
} from "lucide-react";
import LoadingScreen, { usePageSplash } from "../components/LoadingScreen";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
const UPLOAD_MESSAGES = ["Reading your resume…", "Extracting text…", "Analyzing skills…", "Almost done…"];

/* ── Score ring SVG ── */
function ScoreRing({ score }: { score: number }) {
  const r = 56, c = 2 * Math.PI * r, o = c - (Math.min(score, 100) / 100) * c;
  const ring = score >= 75 ? "stroke-[var(--color-success)]" : score >= 40 ? "stroke-[var(--color-warning)]" : "stroke-[var(--color-destructive)]";
  const txt = score >= 75 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
  return (
    <div className="relative inline-flex items-center justify-center" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Match score: ${score}%`}>
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" className="text-border opacity-30" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" className={`${ring} transition-all duration-1000 ease-out`} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} />
      </svg>
      <span className={`absolute text-3xl font-extrabold ${txt}`}>{score}%</span>
    </div>
  );
}

/* ── Trust badge ── */
function TrustBadge() {
  return (
    <span className="pill bg-success/10 text-success border border-success/20 w-fit">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Live Matching Engine
    </span>
  );
}

/* ── MatchResultsSection ── */
function MatchResultsSection({ result }: { result: MatchResult }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section className="card-base !border-primary/20 !shadow-glow">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between cursor-pointer">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
          <Sparkles className="h-5 w-5 text-primary" /> Match Results
        </h2>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted" /> : <ChevronDown className="h-5 w-5 text-muted" />}
      </button>
      {expanded && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <ScoreRing score={result.matchScore} />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <p className="text-xl font-bold text-foreground">
                {result.matchScore >= 75 ? "Strong Match!" : result.matchScore >= 40 ? "Moderate Match" : "Low Match"}
              </p>
              {result.summary && (
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-success-bg border border-success/20 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-success mb-3">
                <CheckCircle2 className="h-4 w-4" /> Skills You Have ({result.matchedSkills.length})
              </h3>
              {result.matchedSkills.length === 0 ? (
                <p className="text-xs text-muted">No matched skills found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((s) => (
                    <span key={s} className="pill bg-success/15 text-success border border-success/20">{s}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl bg-warning-bg border border-warning/20 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-warning mb-3">
                <XCircle className="h-4 w-4" /> Skills You&apos;re Missing ({result.missingSkills.length})
              </h3>
              {result.missingSkills.length === 0 ? (
                <p className="text-xs text-muted">No missing skills — perfect match!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s) => (
                    <span key={s} className="pill bg-warning/15 text-warning border border-warning/20">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {result.summary && (
            <div className="rounded-xl border border-border bg-card-hover/50 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-heading mb-2">
                <Lightbulb className="h-4 w-4 text-primary" /> Recommendations
              </h3>
              <p className="text-sm text-muted leading-relaxed">{result.summary}</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Analysed {result.created_at ? formatDate(result.created_at) : "just now"}
          </div>
        </div>
      )}
    </section>
  );
}

type JobInputMode = "text" | "url" | "image";

/* ═══════════════════════════════════════════════
   DashboardPage — main component
   ═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const [resumes, setResumes] = useState<ResumeUploadResult[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsgIndex, setUploadMsgIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobInputMode, setJobInputMode] = useState<JobInputMode>("text");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobSaving, setJobSaving] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [extractedTitle, setExtractedTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [recommending, setRecommending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<ReturnType<typeof setInterval>>();
  const showSplash = usePageSplash();

  const canMatch = !!selectedResumeId && !!selectedJobId && !matchLoading;
  const filteredJobs = jobSearch.trim()
    ? jobs.filter((j) => (j.title ?? "").toLowerCase().includes(jobSearch.toLowerCase()) || (j.company ?? "").toLowerCase().includes(jobSearch.toLowerCase()))
    : jobs;

  useEffect(() => {
    let cancelled = false;
    Promise.all([listResumes(), listJobDescriptions()]).then(([res, jbs]) => {
      if (cancelled) return; setResumes(res); setJobs(jbs);
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data.");
    }).finally(() => { if (!cancelled) setInitialLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedResumeId) { setRecommendedJobs([]); return; }
    setRecommending(true);
    getRecommendedJobs(selectedResumeId).then(setRecommendedJobs).catch(() => {}).finally(() => setRecommending(false));
  }, [selectedResumeId]);

  useEffect(() => {
    if (!uploading) { clearInterval(uploadTimerRef.current); return; }
    uploadTimerRef.current = setInterval(() => setUploadMsgIndex((i) => (i + 1) % UPLOAD_MESSAGES.length), 2500);
    return () => clearInterval(uploadTimerRef.current);
  }, [uploading]);

  useEffect(() => () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); }, [imagePreviewUrl]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setError(""); setSuccess(""); setUploading(true); setUploadMsgIndex(0);
    try {
      const result = await uploadResume(file);
      setResumes((p) => [result, ...p]); setSelectedResumeId(result.id); setSuccess("Resume uploaded!");
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0]; if (!file) return;
    setError(""); setSuccess(""); setUploading(true); setUploadMsgIndex(0);
    uploadResume(file).then((result) => { setResumes((p) => [result, ...p]); setSelectedResumeId(result.id); setSuccess("Resume uploaded!"); })
      .catch((err) => { setError(err instanceof Error ? err.message : "Upload failed."); }).finally(() => setUploading(false));
  }, []);
  const handleDeleteResume = useCallback(async (e: React.MouseEvent, rid: string) => {
    e.stopPropagation(); if (!confirm("Remove this resume?")) return;
    setError(""); setSuccess("");
    try {
      await deleteResume(rid); setResumes((p) => p.filter((r) => r.id !== rid));
      if (selectedResumeId === rid) { setSelectedResumeId(""); setMatchResult(null); }
      setSuccess("Resume removed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete."); }
  }, [selectedResumeId]);

  const handleSelectRecommended = (jid: string) => { setSelectedJobId(jid); setMatchResult(null); };

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) return; setError(""); setUrlLoading(true);
    try { const r = await fetchJobFromUrl(jobUrl.trim()); setExtractedText(r.text); setExtractedTitle(r.title || ""); setShowExtractedPreview(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to fetch job from URL."); }
    finally { setUrlLoading(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImageFile(f); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(f)); setShowExtractedPreview(false);
  };

  const handleExtractFromImage = async () => {
    if (!imageFile) return; setError(""); setImageLoading(true);
    try { const r = await extractJobFromImage(imageFile); setExtractedText(r.text); setExtractedTitle(r.title || ""); setShowExtractedPreview(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to extract text from image."); }
    finally { setImageLoading(false); }
  };

  const handleSaveExtracted = async () => {
    if (!extractedText.trim()) return; setError(""); setSuccess(""); setJobSaving(true);
    try {
      const job = await createJobDescription({ title: extractedTitle.trim() || undefined, description_text: extractedText });
      setJobs((p) => [job, ...p]); setSelectedJobId(job.id); setShowExtractedPreview(false);
      setExtractedText(""); setExtractedTitle(""); setJobUrl(""); setImageFile(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null);
      setSuccess("Job description saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save job."); }
    finally { setJobSaving(false); }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault(); if (!jobDesc.trim()) return; setError(""); setSuccess(""); setJobSaving(true);
    try {
      const job = await createJobDescription({ title: jobTitle.trim() || undefined, company: jobCompany.trim() || undefined, description_text: jobDesc });
      setJobs((p) => [job, ...p]); setSelectedJobId(job.id);
      setJobTitle(""); setJobCompany(""); setJobDesc(""); setShowJobForm(false);
      setSuccess("Job description saved!");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save job."); }
    finally { setJobSaving(false); }
  };

  const handleRunMatch = async () => {
    if (!selectedResumeId || !selectedJobId) return; setError(""); setSuccess(""); setMatchResult(null); setMatchLoading(true);
    try { const r = await runMatch(selectedResumeId, selectedJobId); setMatchResult(r); }
    catch (err) { setError(err instanceof Error ? err.message : "Match failed."); }
    finally { setMatchLoading(false); }
  };

  /* ══ RENDER ══ */
  return (
    <>
      <LoadingScreen show={showSplash} />
      <div className={`relative transition-opacity duration-500 ease-out ${showSplash ? "opacity-0" : "opacity-100"}`}>
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <div className="text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-heading font-heading sm:text-4xl tracking-tight">Resume &amp; Job Matcher</h1>
          <p className="mt-2 text-base text-muted max-w-xl">Upload your resume, paste or snap a job description — AI instantly tells you how well you fit.</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
          <TrustBadge />
          <span className="pill bg-primary/10 text-primary border border-primary/20"><Zap className="h-3.5 w-3.5" /> Powered by AI</span>
          <span className="pill bg-card border border-border text-muted"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Free to use</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-error-bg border border-destructive/30 px-5 py-3.5 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" /><span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="shrink-0 text-destructive/70 hover:text-destructive cursor-pointer rounded-lg p-1">✕</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-success-bg border border-success/30 px-5 py-3.5 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" /><span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")} className="shrink-0 text-success/70 hover:text-success cursor-pointer rounded-lg p-1">✕</button>
        </div>
      )}

      {initialLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2"><div className="skeleton h-72 w-full" /><div className="skeleton h-72 w-full" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* LEFT: RESUME PANEL */}
            <section className="card-base !p-0 overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-heading"><FileText className="h-5 w-5 text-primary" /> Resume</h2>
                <label className="btn-primary text-xs !px-4 !py-2 !min-h-[0] cursor-pointer">
                  <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              <div className="p-6 space-y-4">
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                    dragOver ? "border-primary bg-primary/5 scale-[1.02] shadow-glow" : "border-border hover:border-primary/30 hover:bg-card-hover/50"
                  } ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <span className="block text-sm text-muted" key={uploadMsgIndex}>{UPLOAD_MESSAGES[uploadMsgIndex]}</span>
                    </div>
                  ) : dragOver ? (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-10 w-10 text-primary" /><p className="text-sm font-semibold text-primary">Drop your file here</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5"><Upload className="h-6 w-6 text-muted opacity-50" /></div>
                      <div>
                        <p className="text-sm text-muted"><span className="text-primary font-semibold underline decoration-primary/30 underline-offset-2 cursor-pointer">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted opacity-60 mt-1">PDF, DOCX, or TXT (max 5 MB)</p>
                      </div>
                    </div>
                  )}
                </div>
                {resumes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Uploaded resumes</p>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {resumes.map((r) => (
                        <div key={r.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-200 ${
                          selectedResumeId === r.id ? "border-primary/40 bg-primary/5 shadow-glow" : "border-border hover:bg-card-hover hover:border-card-glow-border"
                        }`}>
                          <button onClick={() => setSelectedResumeId(r.id)} className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer">
                            <FileText className={`h-5 w-5 shrink-0 ${selectedResumeId === r.id ? "text-primary" : "text-muted"}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-foreground">{r.file_name}</p>
                              <p className="text-xs text-muted">{formatDate(r.created_at)} &middot; {(r.file_size / 1024).toFixed(1)} KB</p>
                            </div>
                            {selectedResumeId === r.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                          </button>
                          <button onClick={(e) => handleDeleteResume(e, r.id)}
                            className="shrink-0 rounded-xl p-2 text-muted hover:text-destructive hover:bg-error-bg transition-all duration-200 cursor-pointer"
                            title="Remove resume" aria-label={`Remove ${r.file_name}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT: JOB DESCRIPTION PANEL */}
            <section className="card-base !p-0 overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-heading"><Briefcase className="h-5 w-5 text-primary" /> Job Description</h2>
                {!showJobForm && !showExtractedPreview && (
                  <button onClick={() => { setShowJobForm(true); setJobInputMode("text"); }} className="btn-primary text-xs !px-4 !py-2 !min-h-[0]">+ New</button>
                )}
              </div>
              <div className="p-6 space-y-4">
                {!showExtractedPreview && !showJobForm && (
                  <div className="flex rounded-xl border border-border p-1 bg-card-hover/50 gap-0.5">
                    {([{ m: "text" as JobInputMode, l: "Paste", i: ScrollText },
                       { m: "url" as JobInputMode, l: "URL", i: Link },
                       { m: "image" as JobInputMode, l: "Image", i: Image }]).map(({ m, l, i: Icon }) => (
                      <button key={m} onClick={() => setJobInputMode(m)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          jobInputMode === m ? "bg-gradient-to-br from-accent-gradient-from/15 to-accent-gradient-to/15 text-primary shadow-sm" : "text-muted hover:text-foreground"
                        }`}>
                        <Icon className="h-4 w-4" /> {l}
                      </button>
                    ))}
                  </div>
                )}

                {jobInputMode === "text" && !showExtractedPreview && !showJobForm && (
                  <div className="space-y-3">
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Job title (optional)</label>
                      <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-field text-sm" placeholder="e.g. Senior Frontend Engineer" /></div>
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Job description</label>
                      <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="input-field textarea-field text-sm" rows={6} placeholder="Paste the full job description here…" /></div>
                    <button onClick={handleSaveJob} disabled={jobSaving || !jobDesc.trim() || jobDesc.trim().length < 20} className="btn-primary w-full">
                      {jobSaving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span> : <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Save &amp; Select</span>}
                    </button>
                  </div>
                )}

                {jobInputMode === "url" && !showExtractedPreview && !showJobForm && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted">Paste a job posting URL to auto-extract the description.</p>
                    <input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} className="input-field text-sm" placeholder="https://example.com/jobs/..." />
                    <button onClick={handleFetchUrl} disabled={urlLoading || !jobUrl.trim()} className="btn-primary w-full">
                      {urlLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Fetching…</span> : <span className="flex items-center gap-2"><Link className="h-4 w-4" /> Fetch from URL</span>}
                    </button>
                  </div>
                )}

                {jobInputMode === "image" && !showExtractedPreview && !showJobForm && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted">Upload a screenshot of the job posting. AI will extract the text.</p>
                    {imagePreviewUrl ? (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl border border-border overflow-hidden">
                          <img src={imagePreviewUrl} alt="Job preview" className="w-full h-48 object-contain bg-card-hover" />
                          <button onClick={() => { setImageFile(null); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); }}
                            className="absolute top-2 right-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border p-1.5 text-muted hover:text-foreground cursor-pointer" aria-label="Remove image">✕</button>
                        </div>
                        <button onClick={handleExtractFromImage} disabled={imageLoading} className="btn-primary w-full">
                          {imageLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Extracting…</span> : <span className="flex items-center gap-2"><Image className="h-4 w-4" /> Extract Text</span>}
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border p-8 text-center hover:border-primary/30 hover:bg-card-hover/50 transition-all duration-200 cursor-pointer">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5"><Image className="h-6 w-6 text-muted opacity-50" /></div>
                        <div><p className="text-sm font-semibold text-muted"><span className="text-primary underline decoration-primary/30 underline-offset-2">Browse</span> or drop an image</p>
                          <p className="text-xs text-muted opacity-60 mt-1">PNG, JPG, or WebP</p></div>
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                )}

                {showExtractedPreview && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl bg-success-bg border border-success/20 px-4 py-2.5 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /><span>Text extracted. Review and edit below before saving.</span>
                    </div>
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Job title</label>
                      <input value={extractedTitle} onChange={(e) => setExtractedTitle(e.target.value)} className="input-field text-sm" placeholder="Extracted job title" /></div>
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Job description</label>
                      <textarea value={extractedText} onChange={(e) => setExtractedText(e.target.value)} className="input-field textarea-field text-sm" rows={6} placeholder="Extracted text will appear here…" /></div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveExtracted} disabled={jobSaving || !extractedText.trim()} className="btn-primary flex-1">
                        {jobSaving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span> : <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Save &amp; Select</span>}
                      </button>
                      <button onClick={() => { setShowExtractedPreview(false); setExtractedText(""); setExtractedTitle(""); }} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}

                {showJobForm && !showExtractedPreview && (
                  <form onSubmit={handleSaveJob} className="space-y-3">
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Job title <span className="opacity-50">(optional)</span></label>
                      <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-field text-sm" placeholder="e.g. Senior Frontend Engineer" /></div>
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Company <span className="opacity-50">(optional)</span></label>
                      <input value={jobCompany} onChange={(e) => setJobCompany(e.target.value)} className="input-field text-sm" placeholder="e.g. Acme Corp" /></div>
                    <div><label className="mb-1.5 block text-xs font-medium text-muted">Job description *</label>
                      <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} className="input-field textarea-field text-sm" rows={6} placeholder="Paste the full job description here…" required /></div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={jobSaving || !jobDesc.trim()} className="btn-primary flex-1">
                        {jobSaving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span> : <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Save job description</span>}
                      </button>
                      <button type="button" onClick={() => { setShowJobForm(false); setJobDesc(""); setJobTitle(""); setJobCompany(""); }} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
                )}

                {!showJobForm && !showExtractedPreview && jobs.length > 0 && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} className="input-field text-sm pl-10" placeholder="Search saved jobs…" aria-label="Search saved jobs" />
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      {jobSearch && <button onClick={() => setJobSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer">✕</button>}
                    </div>
                    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {(jobSearch ? filteredJobs : jobs).map((j) => (
                        <button key={j.id} onClick={() => { setSelectedJobId(j.id); setMatchResult(null); }}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 cursor-pointer ${
                            selectedJobId === j.id ? "border-primary/40 bg-primary/5 shadow-glow" : "border-border hover:bg-card-hover hover:border-card-glow-border"
                          }`}>
                          <Briefcase className={`h-5 w-5 shrink-0 ${selectedJobId === j.id ? "text-primary" : "text-muted"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-foreground">{j.title || "Untitled position"}{j.company ? <span className="text-muted font-normal"> &middot; {j.company}</span> : null}</p>
                            <p className="text-xs text-muted mt-0.5">{formatDate(j.created_at)}</p>
                          </div>
                          {selectedJobId === j.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!showJobForm && !showExtractedPreview && jobs.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-6 text-muted">
                    <Briefcase className="h-8 w-8 opacity-40" />
                    <p className="text-sm font-medium">No job descriptions yet.</p>
                    <p className="text-xs opacity-60">Use the tabs above to paste, fetch from URL, or upload an image.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-accent-gradient-from/5 to-accent-gradient-to/5 p-8 shadow-glow">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {selectedResumeId && selectedJobId ? "Ready to go — click below to see your match!"
                  : !selectedResumeId && !selectedJobId ? "Upload a resume and add a job description to get started"
                  : !selectedResumeId ? "Upload a resume first" : "Add a job description above"}
              </p>
            </div>
            <button onClick={handleRunMatch} disabled={!canMatch} className="btn-primary text-base px-12 py-4 min-h-[56px] text-lg">
              {matchLoading ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Matching…</span>
                : <span className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Analyze Match</span>}
            </button>
          </div>

          {selectedResumeId && !matchResult && (
            <section className="card-base">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-heading">Recommended for You</h2>
                {recommending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
              </div>
              {recommending ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted">
                  <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Finding the best matches…</p>
                </div>
              ) : recommendedJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted">
                  <TrendingUp className="h-8 w-8 opacity-40" /><p className="text-sm">No recommendations yet.</p>
                  <p className="text-xs opacity-60">Add more job descriptions to get personalized recommendations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedJobs.map((job) => (
                    <button key={job.id} onClick={() => handleSelectRecommended(job.id)}
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                        selectedJobId === job.id ? "border-primary/40 bg-primary/5 shadow-glow" : "border-border hover:bg-card-hover hover:border-card-glow-border"
                      }`}>
                      <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                        job.matchScore >= 70 ? "bg-success/15 text-success" : job.matchScore >= 40 ? "bg-warning/15 text-warning" : "bg-error-bg text-destructive"
                      }`}>{job.matchScore}%</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{job.title || "Untitled position"}{job.company ? <span className="text-muted font-normal"> &middot; {job.company}</span> : null}</p>
                        <p className="mt-1 text-xs text-muted">{job.matchedSkills.length} skills match{job.missingSkills.length > 0 ? ` · ${job.missingSkills.length} to improve` : ""}</p>
                        {job.matchedSkills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.matchedSkills.slice(0, 4).map((s) => (<span key={s} className="pill bg-success/15 text-success border border-success/20">{s}</span>))}
                            {job.matchedSkills.length > 4 && <span className="text-[10px] text-muted self-center">+{job.matchedSkills.length - 4} more</span>}
                          </div>
                        )}
                      </div>
                      {selectedJobId === job.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {matchResult && <MatchResultsSection result={matchResult} />}
          </>
        )}
        </div>
      </div>
    </>
  );
}