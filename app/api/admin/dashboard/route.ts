import { NextResponse } from "next/server";
import { getCurrentAdminUser, getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type WaitlistRow = Record<string, unknown>;
type AnalyticsRow = Record<string, unknown>;

type WaitlistUser = {
  email: string;
  joined: string;
  country: string;
  source: string;
  status: string;
};

type TrendPoint = {
  date: Date;
  label: string;
  waitlist: number;
  visitors: number;
  returning: number;
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

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isSameDay(date: Date, compareTo: Date) {
  return startOfDay(date).getTime() === startOfDay(compareTo).getTime();
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

function buildTrend(waitlistRows: WaitlistRow[], analyticsRows: AnalyticsRow[]) {
  const now = new Date();

  return Array.from({ length: 7 }, (_, index): TrendPoint => {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (6 - index));
    const pageViewsForDay = analyticsRows.filter(
      (row) =>
        readString(row, ["event_name"], "") === "page_view" &&
        isSameDay(readDate(row), date),
    );
    const sessionCounts = pageViewsForDay.reduce<Record<string, Set<string>>>(
      (acc, row) => {
        const visitorId = readString(row, ["visitor_id"], "");
        const sessionId = readString(row, ["session_id"], "");

        if (!visitorId || !sessionId) {
          return acc;
        }

        acc[visitorId] ??= new Set();
        acc[visitorId].add(sessionId);
        return acc;
      },
      {},
    );

    return {
      date,
      label: date.toLocaleDateString("en", { weekday: "short" }),
      waitlist: waitlistRows.filter((row) => isSameDay(readDate(row), date)).length,
      visitors: new Set(pageViewsForDay.map((row) => readString(row, ["visitor_id"], ""))).size,
      returning: Object.values(sessionCounts).filter((sessions) => sessions.size > 1).length,
    };
  });
}

function uniqueCount(rows: AnalyticsRow[], key: string) {
  return new Set(rows.map((row) => readString(row, [key], "")).filter(Boolean)).size;
}

function averageSessionDuration(rows: AnalyticsRow[]) {
  const durations = rows
    .filter((row) => readString(row, ["event_name"], "") === "session_end")
    .map((row) => row.duration_seconds)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (!durations.length) {
    return 0;
  }

  return Math.round(
    durations.reduce((total, duration) => total + duration, 0) / durations.length,
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

function sessionStats(pageViews: AnalyticsRow[]) {
  const pagesBySession = pageViews.reduce<Record<string, number>>((acc, row) => {
    const sessionId = readString(row, ["session_id"], "");

    if (!sessionId) {
      return acc;
    }

    acc[sessionId] = (acc[sessionId] ?? 0) + 1;
    return acc;
  }, {});
  const counts = Object.values(pagesBySession);

  if (!counts.length) {
    return { bounceRate: 0, pagesPerSession: 0 };
  }

  const bounces = counts.filter((count) => count === 1).length;
  const totalPages = counts.reduce((total, count) => total + count, 0);

  return {
    bounceRate: Number(((bounces / counts.length) * 100).toFixed(1)),
    pagesPerSession: Number((totalPages / counts.length).toFixed(1)),
  };
}

export async function GET() {
  try {
    const user = await getCurrentAdminUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

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
    const dayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const dailySignups = rows.filter((row) => isSameDay(readDate(row), now)).length;
    const monthlySignups = rows.filter((row) => isSameMonth(readDate(row), now)).length;
    const analyticsResult = await supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", monthStart.toISOString());
    const analyticsRows = analyticsResult.error ? [] : (analyticsResult.data ?? []);
    const pageViews = analyticsRows.filter(
      (row) => readString(row, ["event_name"], "") === "page_view",
    );
    const dailyPageViews = pageViews.filter((row) => readDate(row) >= dayStart);
    const monthlyVisitors = uniqueCount(pageViews, "visitor_id");
    const dailyVisitors = uniqueCount(dailyPageViews, "visitor_id");
    const monthlySessions = uniqueCount(pageViews, "session_id");
    const visitorSessions = pageViews.reduce<Record<string, Set<string>>>((acc, row) => {
      const visitorId = readString(row, ["visitor_id"], "");
      const sessionId = readString(row, ["session_id"], "");

      if (!visitorId || !sessionId) {
        return acc;
      }

      acc[visitorId] ??= new Set();
      acc[visitorId].add(sessionId);
      return acc;
    }, {});
    const returningVisitors = Object.values(visitorSessions).filter(
      (sessions) => sessions.size > 1,
    ).length;
    const conversionRate = monthlyVisitors
      ? Number(((monthlySignups / monthlyVisitors) * 100).toFixed(1))
      : 0;
    const engagement = sessionStats(pageViews);

    const waitlistUsers: WaitlistUser[] = rows.map((row) => ({
      email: readString(row, ["email"]),
      joined: formatDate(readDate(row)),
      country: readString(row, ["country", "country_name"], "Unknown"),
      source: readString(row, ["source", "utm_source", "referrer"], "Direct"),
      status: readString(row, ["status"], "Confirmed"),
    }));

    const sourceCounts = pageViews.reduce<Record<string, number>>((acc, row) => {
      const source = readString(row, ["source"], "Direct");
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {});

    const trafficSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({
        source,
        value: pageViews.length ? Math.round((count / pageViews.length) * 100) : 0,
        sessions: count.toLocaleString(),
      }));
    const trend = buildTrend(rows, pageViews);

    return NextResponse.json({
      metrics: {
        averageSessionTime: formatDuration(averageSessionDuration(analyticsRows)),
        bounceRate: engagement.bounceRate,
        conversionRate,
        dailyVisitors,
        dailySignups,
        monthlyVisitors,
        monthlySignups,
        pagesPerSession: engagement.pagesPerSession,
        returningVisitors,
        totalSignups: rows.length,
        totalSessions: monthlySessions,
      },
      analyticsConfigured: !analyticsResult.error,
      waitlistTrend: buildWaitlistTrend(rows),
      trend: trend.map((item) => ({
        label: item.label,
        waitlist: item.waitlist,
        visitors: item.visitors,
        returning: item.returning,
        conversion:
          item.visitors > 0 ? Number(((item.waitlist / item.visitors) * 100).toFixed(1)) : 0,
      })),
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
