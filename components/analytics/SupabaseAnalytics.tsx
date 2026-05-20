"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const visitorKey = "questxs_visitor_id";
const sessionKey = "questxs_session_id";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);

  if (existing) {
    return existing;
  }

  const id = createId(prefix);
  storage.setItem(key, id);
  return id;
}

function getSource() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");

  if (utmSource) {
    return utmSource;
  }

  if (!document.referrer) {
    return "Direct";
  }

  try {
    return new URL(document.referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Referral";
  }
}

function sendAnalytics(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export default function SupabaseAnalytics() {
  const pathname = usePathname();
  const sessionStartedAt = useRef(Date.now());

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return;
    }

    const visitorId = getStoredId(window.localStorage, visitorKey, "visitor");
    const sessionId = getStoredId(window.sessionStorage, sessionKey, "session");

    sendAnalytics({
      eventName: "page_view",
      visitorId,
      sessionId,
      path: `${pathname}${window.location.search}`,
      referrer: document.referrer || "Direct",
      source: getSource(),
    });
  }, [pathname]);

  useEffect(() => {
    function endSession() {
      if (pathname.startsWith("/admin")) {
        return;
      }

      const visitorId = window.localStorage.getItem(visitorKey);
      const sessionId = window.sessionStorage.getItem(sessionKey);

      if (!visitorId || !sessionId) {
        return;
      }

      sendAnalytics({
        eventName: "session_end",
        visitorId,
        sessionId,
        path: `${pathname}${window.location.search}`,
        referrer: document.referrer || "Direct",
        source: getSource(),
        durationSeconds: (Date.now() - sessionStartedAt.current) / 1000,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        endSession();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", endSession);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", endSession);
    };
  }, [pathname]);

  return null;
}
