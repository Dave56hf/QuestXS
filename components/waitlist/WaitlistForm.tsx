"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { track } from "@vercel/analytics";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const roles = ["Trader", "Investor", "Developer", "Content Creator", "Other"];

const inputClassName =
  "w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white placeholder-muted transition focus:border-accent focus:outline-none";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const urlRef = new URLSearchParams(window.location.search).get("ref");
      if (urlRef) setRefCode(urlRef);
    } catch {
      // noop
    }
  }, []);

  async function handleSubmit() {
    setError("");

    if (!name || !email || !role) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          fullName: name,
          email,
          role,
          referredBy: refCode,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Referral/points join (runs after the existing email confirmation succeeds)
      try {
        if (refCode) {
          // noop: refCode is already loaded from ?ref=
        }

        const joinRes = await fetch("/api/waitlist/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, role, referredBy: refCode }),
        });

        const joinData = await joinRes.json();

        if (joinRes.ok && joinData?.referralCode) {
          window.location.href = `/dashboard?code=${encodeURIComponent(joinData.referralCode)}`;
          return;
        }
      } catch (e) {
        console.error(e);
      }

      setSubmitted(true);
      track("waitlist_signup", { role });

      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "waitlist_signup",
          visitorId:
            window.localStorage.getItem("questxs_visitor_id") ?? "anonymous",
          sessionId:
            window.sessionStorage.getItem("questxs_session_id") ?? "session",
          path: window.location.pathname,
          referrer: document.referrer || "Direct",
          source:
            new URLSearchParams(window.location.search).get("utm_source") ??
            "Direct",
        }),
      });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-md px-8 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h3 className="mt-6 font-display text-xl font-semibold">
          You&apos;re on the list!
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          Check your inbox — we sent you a confirmation email.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md p-8">
      <h3 className="font-display text-xl font-semibold">Secure Your Spot</h3>
      <p className="mt-2 text-sm text-muted">
        Join the first group to access Quest when we open the doors.
      </p>

      <div className="mt-6 space-y-4">
        <input
          className={inputClassName}
          placeholder="Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className={inputClassName}
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <select
          className={inputClassName}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">Select your role</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {error && <p className="text-center text-sm text-danger">{error}</p>}

        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join the Waitlist"}
        </Button>

        <div className="flex items-center justify-center pt-2">
          <p className="ml-3 text-sm text-muted">Join the waitlist now</p>
        </div>
      </div>
    </Card>
  );
}
