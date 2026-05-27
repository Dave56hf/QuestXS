"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const roles = ["Trader", "Investor", "Developer", "Content Creator", "Other"];

const inputClassName =
  "w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white placeholder-muted transition focus:border-accent focus:outline-none";

export default function WaitlistForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refCode, setRefCode] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCode(ref);
    }
  }, [searchParams]);

  async function openDashboard() {
    const joinResponse = await fetch("/api/waitlist/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        role,
        referredBy: refCode || undefined,
      }),
    });

    const joinData = (await joinResponse.json()) as {
      referralCode?: string;
      error?: string;
    };

    if (!joinResponse.ok || !joinData.referralCode) {
      throw new Error(joinData.error ?? "Could not open your dashboard.");
    }

    window.localStorage.setItem("questxs_dashboard_code", joinData.referralCode);
    router.push(`/dashboard?code=${joinData.referralCode}`);
  }

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
        body: JSON.stringify({ fullName: name, email, role }),
      });
      const data = (await response.json()) as { error?: string };

      if (response.status === 409) {
        await openDashboard();
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

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

      await openDashboard();
    } catch (err) {
      console.error("Waitlist signup error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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
