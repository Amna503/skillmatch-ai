import { Sparkles } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        {/* Left */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            SkillMatch AI
          </span>
          <span className="hidden text-sm text-muted sm:inline">
            &mdash; Smart resume-to-job matching
          </span>
        </div>

        {/* Center links */}
        <div className="flex items-center gap-6 text-sm">
          <a
            href="#"
            className="text-muted hover:text-foreground transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            About
          </a>
          <a
            href="#"
            className="text-muted hover:text-foreground transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            Contact
          </a>
          <a
            href="#"
            className="text-muted hover:text-foreground transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            Privacy
          </a>
        </div>

        {/* Right */}
        <p className="text-xs text-muted">
          &copy; {currentYear} SkillMatch AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}