import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://nlqhbkxlhbrkktqhbnus.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWhia3hsaGJya2t0cWhibnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODk1MTcsImV4cCI6MjEwMTc2NTUxN30.houULAfgLUtPB0pXG3j6cYJH3tgXgInAeySpCauSzWs";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);