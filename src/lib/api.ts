import { supabase, supabaseUrl } from "./supabase";

// ============================================================
// Types
// ============================================================

export interface ResumeUploadResult {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface JobDescription {
  id: string;
  user_id: string;
  title: string | null;
  company: string | null;
  description_text: string;
  created_at: string;
}

export interface MatchResult {
  id: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  created_at: string;
  resume?: { id: string; file_name: string; file_type: string; created_at: string };
  job?: { id: string; title: string | null; company: string | null; created_at: string };
}

// ============================================================
// Auth helpers
// ============================================================

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export function getCurrentUser() {
  return supabase.auth.getUser();
}

// ============================================================
// Edge Function helpers
// ============================================================

function functionUrl(name: string): string {
  return `${supabaseUrl}/functions/v1/${name}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================================
// Resumes
// ============================================================

/**
 * Upload a resume file (PDF, DOCX, or TXT).
 * Text extraction runs in the background automatically.
 */
export async function uploadResume(file: File): Promise<ResumeUploadResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(functionUrl("upload-resume"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Upload failed.");
  return body.resume;
}

/**
 * List all resumes for the current user, including extraction status.
 */
export async function listResumes() {
  const headers = await authHeaders();
  const res = await fetch(functionUrl("match-history") + "?mode=resumes", {
    method: "GET",
    headers,
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to fetch resumes.");
  return body.resumes;
}

export async function deleteResume(resumeId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const res = await fetch(functionUrl("delete-resume"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ resume_id: resumeId }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to delete resume.");
}

// ============================================================
// Job Descriptions
// ============================================================

export async function createJobDescription(input: {
  title?: string;
  company?: string;
  description_text: string;
}): Promise<JobDescription> {
  const headers = await authHeaders();
  const res = await fetch(functionUrl("job-descriptions"), {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to create job description.");
  return body.job;
}

export async function listJobDescriptions(): Promise<JobDescription[]> {
  const headers = await authHeaders();
  const res = await fetch(functionUrl("job-descriptions"), {
    method: "GET",
    headers,
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to fetch job descriptions.");
  return body.jobs;
}

export async function getJobDescription(id: string): Promise<JobDescription> {
  const headers = await authHeaders();
  const res = await fetch(`${functionUrl("job-descriptions")}?id=${id}`, {
    method: "GET",
    headers,
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Job description not found.");
  return body.job;
}

// ============================================================
// Matching
// ============================================================

export async function runMatch(resumeId: string, jobId: string): Promise<MatchResult> {
  const headers = await authHeaders();
  const res = await fetch(functionUrl("match"), {
    method: "POST",
    headers,
    body: JSON.stringify({ resume_id: resumeId, job_id: jobId }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Match failed.");
  return body.match;
}

// ============================================================
// Recommended Jobs
// ============================================================

export interface RecommendedJob {
  id: string;
  title: string | null;
  company: string | null;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  created_at: string;
}

export async function getRecommendedJobs(resumeId: string): Promise<RecommendedJob[]> {
  const headers = await authHeaders();
  const res = await fetch(functionUrl("recommended-jobs"), {
    method: "POST",
    headers,
    body: JSON.stringify({ resume_id: resumeId }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to get recommendations.");
  return body.recommendations;
}

// ============================================================
// Match History
// ============================================================

export async function getMatchHistory(): Promise<MatchResult[]> {
  const headers = await authHeaders();
  const res = await fetch(functionUrl("match-history"), {
    method: "GET",
    headers,
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to fetch match history.");
  return body.matches;
}