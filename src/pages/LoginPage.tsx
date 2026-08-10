import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn, resetPassword } from "../lib/api";
import { LogIn, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function friendlyServerError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email or password doesn't look right — double-check and try again.";
  }
  if (m.includes("email not confirmed")) {
    return "Your email isn't confirmed yet. Check your inbox for the confirmation link.";
  }
  if (m.includes("rate limit")) {
    return "Too many attempts — please wait a moment and try again.";
  }
  return message;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!email.trim()) {
      errs.email = "Please enter your email address.";
    } else if (!isValidEmail(email)) {
      errs.email = "That email doesn't look quite right — check it and try again.";
    }
    if (!password) errs.password = "Please enter your password.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setNotice("");
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(
        friendlyServerError(
          err instanceof Error ? err.message : "Sign in failed. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setFormError("");
    setNotice("");
    if (!email.trim() || !isValidEmail(email)) {
      setFieldErrors({
        email:
          "Enter your email address first so we know where to send the reset link.",
      });
      return;
    }
    setResetting(true);
    try {
      await resetPassword(email.trim());
      setNotice(
        "If an account exists for that email, we've sent a password reset link."
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "We couldn't send a reset link. Please try again."
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-page px-4 py-10 transition-colors duration-200">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px]">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to shadow-glow">
            <Logo className="h-9 w-9 text-on-primary" />
          </div>
          <h1 className="text-heading font-heading text-2xl font-extrabold tracking-tight">
            SkillMatch AI
          </h1>
          <p className="mt-1.5 text-sm text-muted">Sign in to your account</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="card-base space-y-5 !p-6 sm:!p-8"
        >
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-error-bg px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-bg px-4 py-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-heading"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email)
                  setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              className={`input-field ${fieldErrors.email ? "!border-destructive" : ""}`}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-sm text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-heading"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="text-xs font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-60 cursor-pointer"
              >
                {resetting ? "Sending…" : "Forgot password?"}
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                className={`input-field pr-12 ${fieldErrors.password ? "!border-destructive" : ""}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:text-heading cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-sm text-destructive">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                Logging in…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Log In
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}