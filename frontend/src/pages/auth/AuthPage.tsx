import { useState } from "react";
import type { FormEvent } from "react";
import { BrainCircuit, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const { login, register, loginAsDemo } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  const handleDemo = async () => {
    setError(null);
    setDemoSubmitting(true);
    try {
      await loginAsDemo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start a demo session. Please try again.");
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-7 shadow-panel animate-slide-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <h1 className="text-base font-semibold text-foreground">AI Research Assistant</h1>
          <p className="mt-1 text-[13px] text-muted">
            {mode === "login" ? "Sign in to continue your research." : "Create an account to get started."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={demoSubmitting || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary-light/40 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {demoSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Try demo account
        </button>
        <p className="mb-4 mt-1.5 text-center text-[11px] text-muted">
          No sign-up needed — starts a temporary account instantly.
        </p>
        <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-5 flex rounded-md border border-border bg-slate-50 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-sm py-1.5 font-medium transition-colors ${
              mode === "login" ? "bg-white text-primary shadow-soft" : "text-muted"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 rounded-sm py-1.5 font-medium transition-colors ${
              mode === "register" ? "bg-white text-primary shadow-soft" : "text-muted"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === "register" && (
            <Field label="Name">
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                className="w-full rounded-md border border-border bg-white px-3 py-2 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      {children}
    </label>
  );
}
