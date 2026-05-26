import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const allowedEvents = new Set(["page_view", "session_end", "waitlist_signup"]);

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().slice(0, 500) || fallback;
}

function cleanDuration(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const eventName = cleanString(body.eventName);

    if (!allowedEvents.has(eventName)) {
      return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventName, // was event_name
      session_id: cleanString(body.sessionId, "session").slice(0, 120),
      page_url: cleanString(body.path, "/").slice(0, 500), // was path
      referrer: cleanString(body.referrer, "Direct").slice(0, 500),
      utm_source: cleanString(body.source, "Direct").slice(0, 120), // was source
      duration_seconds: cleanDuration(body.durationSeconds),
      device_type: cleanString(body.deviceType).slice(0, 50) || null,
      metadata: {
        user_agent: cleanString(
          request.headers.get("user-agent"),
          "Unknown",
        ).slice(0, 500),
        visitor_id: cleanString(body.visitorId, "anonymous").slice(0, 120),
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record analytics event.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
