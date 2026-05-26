"use client";

import { Eye, EyeOff, LockKeyhole, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const inputClassName =
  "w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white placeholder-muted transition focus:border-accent focus:outline-none";

export default function AdminSignIn({ redirectTo = "/admin" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!rememberMe) {
        window.sessionStorage.setItem("questxs_admin_session_only", "true");
      }

      setSuccess(true);
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 py-16">
      <div className="absolute left-[-12rem] top-24 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute right-[-14rem] bottom-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

      <section className="relative w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
          <LockKeyhole className="h-6 w-6 text-accent" />
        </div>
        <div className="mt-6">
          <Badge>QuestXS Admin</Badge>
          <h1 className="mt-5 font-display text-3xl font-bold">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Access the operating dashboard for waitlist, analytics, and platform metrics.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <input
            className={inputClassName}
            placeholder="Admin email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
          />
          <div className="relative">
            <input
              className={`${inputClassName} pr-12`}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-white"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              checked={rememberMe}
              className="h-4 w-4 rounded border-border bg-bg accent-accent"
              type="checkbox"
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember this device
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-accent">Access granted. Opening dashboard...</p>}

          <Button
            className="w-full"
            disabled={loading}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Enter Dashboard"
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
