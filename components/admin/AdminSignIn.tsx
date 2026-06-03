"use client";

import { Eye, EyeOff, LockKeyhole, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { signInAdmin } from "@/lib/actions/admin-auth";

const inputClassName =
  "w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white placeholder-muted transition focus:border-accent focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Enter Dashboard"
      )}
    </Button>
  );
}

export default function AdminSignIn({
  redirectTo = "/admin",
}: {
  redirectTo?: string;
}) {
  const [state, formAction] = useFormState(signInAdmin, null);
  const [showPassword, setShowPassword] = useState(false);

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

        <form action={formAction} className="mt-8 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <input
            className={inputClassName}
            placeholder="Admin email"
            type="email"
            name="email"
            autoComplete="email"
            required
          />

          <div className="relative">
            <input
              className={`${inputClassName} pr-12`}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
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

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <SubmitButton />
        </form>
      </section>
    </main>
  );
}
