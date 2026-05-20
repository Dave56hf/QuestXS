import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type WaitlistRow = Record<string, unknown>;

type WaitlistUser = {
  email: string;
  joined: string;
  country: string;
  source: string;
  status: string;
};

function readString(row: WaitlistRow, keys: string[], fallback = "Unknown") {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function readDate(row: WaitlistRow) {
  const value = readString(row, ["created_at", "inserted_at", "date_joined"], "");
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(date: Date, compareTo: Date) {
  return date.toDateString() === compareTo.toDateString();
}

function isSameMonth(date: Date, compareTo: Date) {
  return (
    date.getUTCFullYear() === compareTo.getUTCFullYear() &&
    date.getUTCMonth() === compareTo.getUTCMonth()
  );
}

function buildWaitlistTrend(rows: WaitlistRow[]) {
  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (6 - index));

    return {
      label: date.toLocaleDateString("en", { weekday: "short" }),
      count: rows.filter((row) => isSameDay(readDate(row), date)).length,
    };
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const orderedResult = await supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false });
    const result = orderedResult.error
      ? await supabase.from("waitlist").select("*")
      : orderedResult;
    const { data, error } = result;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const now = new Date();
    const dailySignups = rows.filter((row) => isSameDay(readDate(row), now)).length;
    const monthlySignups = rows.filter((row) => isSameMonth(readDate(row), now)).length;

    const waitlistUsers: WaitlistUser[] = rows.map((row) => ({
      email: readString(row, ["email"]),
      joined: formatDate(readDate(row)),
      country: readString(row, ["country", "country_name"], "Unknown"),
      source: readString(row, ["source", "utm_source", "referrer"], "Direct"),
      status: readString(row, ["status"], "Confirmed"),
    }));

    const sourceCounts = waitlistUsers.reduce<Record<string, number>>((acc, user) => {
      acc[user.source] = (acc[user.source] ?? 0) + 1;
      return acc;
    }, {});

    const trafficSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({
        source,
        value: rows.length ? Math.round((count / rows.length) * 100) : 0,
        sessions: count.toLocaleString(),
      }));

    return NextResponse.json({
      metrics: {
        dailySignups,
        monthlySignups,
        totalSignups: rows.length,
      },
      waitlistTrend: buildWaitlistTrend(rows),
      waitlistUsers,
      trafficSources,
      lastSynced: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load admin dashboard.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
