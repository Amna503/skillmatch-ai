import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../lib/api";
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import LoadingScreen, { usePageLoader } from "../components/LoadingScreen";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { loading: showSplash } = usePageLoader();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!email.trim()) {
      errs.email = "Please enter your email address.";
    } else if (!isValidEmail(email)) {
      errs.email = "That email doesn't look quite right — check it and try again.";
    }
    if (!password) {
      errs.password = "Please create a password.";
    } else if (password.length < 6) {
      errs.password = "Use at least 6 characters for your password.";
    }
    if (!confirmPassword) {
      errs.confirm = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      errs.confirm = "Passwords don't match — please re-enter.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signUp(email.trim(), password);
      if (data.user?.identities?.length === 0) {
        setFormError(
          "An account with this email already exists. Try logging in instead."
        );
        return;
      }
      setCreated(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Sign up failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──
  if (created) {
    return (
      <>
        <LoadingScreen show={showSplash} />
        <div className={`relative min-h-screen transition-opacity duration-500 ease-out ${showSplash ? "opacity-0" : "opacity-100"}`}>
          <div className="relative flex min-h-screen items-center justify-center bg-page px-4 py-10 transition-colors duration-200">
            <div className="absolute right-4 top-4">
              <ThemeToggle />
            </div>
        <div className="w-full max-w-[420px]">
          {/* Same branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-gradient-from to-accent-gradient-to shadow-glow">
              <Logo className="h-9 w-9 text-on-primary" />
            </div>
            <h1 className="text-heading font-heading text-2xl font-extrabold tracking-tight">
              SkillMatch AI
            </h1>
          </div>

          <div className="card-base !p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg border border-success/30">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-heading font-heading text-xl font-extrabold">
              Account created!
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Check{" "}
              <span className="font-medium text-foreground">{email}</span> for a
              confirmation link — you&apos;ll need to confirm before logging in.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary mt-6 w-full"
            >
              Go to Log In
            </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  }

  // ── Form state ──
  return (
    <>
      <LoadingScreen show={showSplash} />
      <div className={`relative min-h-screen transition-opacity duration-500 ease-out ${showSplash ? "opacity-0" : "opacity-100"}`}>
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
          <p className="mt-1.5 text-sm text-muted">
            Create your account to get started
          </p>
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
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-heading"
            >
              Password
            </label>
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
                placeholder="Min. 6 characters"
                autoComplete="new-password"
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

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-sm font-medium text-heading"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirm)
                  setFieldErrors((p) => ({ ...p, confirm: undefined }));
              }}
              className={`input-field ${fieldErrors.confirm ? "!border-destructive" : ""}`}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirm)}
            />
            {fieldErrors.confirm && (
              <p className="mt-1.5 text-sm text-destructive">
                {fieldErrors.confirm}
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                Creating account…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Log in
          </Link>
        </p>
        </div>
        </div>
      </div>
    </>
  );
}