# SkillMatch AI

An AI-powered resume and job description matching platform. Upload your resume, paste or snap a job description, and instantly see how well you fit.

## Features

- **Resume Upload** — Support for PDF, DOCX, and TXT files with drag-and-drop
- **Job Description Input** — Paste text, fetch from URL, or upload a screenshot for AI text extraction
- **AI Match Analysis** — Instant skill matching with percentage score, matched/missing skills breakdown, and personalized recommendations
- **Job Recommendations** — Get AI-suggested job matches based on your resume skills
- **Match History** — Track and review all your past analyses
- **Auth** — Email/password and social login (Google, GitHub, Apple) via Supabase
- **Dark/Light Mode** — Theme toggle with system preference support

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS 4
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/Amna503/skillmatch-ai.git
cd skillmatch-ai
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components (Header, Footer, AuthGuard, ThemeProvider, etc.)
├── lib/            # Supabase client, API helpers
├── pages/          # Route pages (Dashboard, Login, Signup, History, Status)
└── main.tsx        # App entry point
```

## License

MIT
