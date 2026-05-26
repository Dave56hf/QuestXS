"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import useSWR from "swr";
import Badge from "@/components/ui/Badge";
import BroadcastCenter from "@/components/admin/BroadcastCenter";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AdminPageKey =
  | "overview"
  | "waitlist"
  | "analytics"
  | "traffic"
  | "engagement"
  | "emails"
  | "settings";

type ChartDatum = {
  label: string;
  visitors: number;
  waitlist: number;
  conversion: number;
  returning: number;
};

type WaitlistUser = {
  email: string;
  joined: string;
  country: string;
  source: string;
  status: string;
};

type TrafficSource = {
  source: string;
  value: number;
  sessions: string;
};

type AdminDashboardData = {
  metrics: {
    averageSessionTime: string;
    bounceRate: number;
    conversionRate: number;
    dailyVisitors: number;
    dailySignups: number;
    monthlyVisitors: number;
    monthlySignups: number;
    pagesPerSession: number;
    returningVisitors: number;
    totalSignups: number;
    totalSessions: number;
  };
  analyticsConfigured: boolean;
  trend: ChartDatum[];
  waitlistUsers: WaitlistUser[];
  trafficSources: TrafficSource[];
  lastSynced: string;
};

const navItems: Array<{ label: string; href: string; page: AdminPageKey }> = [
  { label: "Overview", href: "/admin", page: "overview" },
  { label: "Waitlist Users", href: "/admin/waitlist", page: "waitlist" },
  { label: "Analytics", href: "/admin/analytics", page: "analytics" },
  { label: "Traffic Sources", href: "/admin/traffic", page: "traffic" },
  { label: "Engagement", href: "/admin/engagement", page: "engagement" },
  { label: "Emails", href: "/admin/emails", page: "emails" },
  { label: "Settings", href: "/admin/settings", page: "settings" },
];

const emptyTrend: ChartDatum[] = [
  { label: "Mon", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Tue", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Wed", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Thu", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Fri", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Sat", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Sun", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
];

const emptyMetrics: AdminDashboardData["metrics"] = {
  averageSessionTime: "0m 00s",
  bounceRate: 0,
  conversionRate: 0,
  dailyVisitors: 0,
  dailySignups: 0,
  monthlyVisitors: 0,
  monthlySignups: 0,
  pagesPerSession: 0,
  returningVisitors: 0,
  totalSignups: 0,
  totalSessions: 0,
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to load dashboard data.");
  }

  return payload;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value > 9999 ? "compact" : "standard",
  }).format(value);
}

function formatLastSynced(value?: string) {
  if (!value) {
    return "Syncing...";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function chartPath(values: number[]) {
  if (values.length <= 1) {
    return "M 0 50 L 100 50";
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 78 - ((value - min) / range) * 58;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function PageHeader({
  badge,
  title,
  description,
  aside,
}: {
  badge?: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        {badge && <Badge>{badge}</Badge>}
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {aside}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5 transition duration-200 hover:border-accent/30 hover:bg-surface2">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {value}
      </p>
      <p className="mt-3 text-xs text-accent">{detail}</p>
    </article>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      {children}
    </section>
  );
}

function LineChart({
  title,
  subtitle,
  dataKey,
  data,
}: {
  title: string;
  subtitle: string;
  dataKey: keyof ChartDatum;
  data: ChartDatum[];
}) {
  const values = data.map((item) => Number(item[dataKey]) || 0);
  const path = chartPath(values);
  const area = `${path} L 100 92 L 0 92 Z`;

  return (
    <Panel className="transition duration-200 hover:border-accent/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <Badge>Live</Badge>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-bg p-4">
        <svg
          viewBox="0 0 100 100"
          className="h-48 w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${String(dataKey)}-area`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 38, 56, 74, 92].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#1f1f1f" strokeWidth="0.6" />
          ))}
          <path d={area} fill={`url(#${String(dataKey)}-area)`} />
          <path d={path} fill="none" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
        <div className="mt-3 grid grid-cols-7 text-center text-xs text-muted">
          {data.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function StatusPill({ status }: { status: string }) {
  const isConfirmed = status === "Confirmed";
  const isInvited = status === "Invited";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        isConfirmed
          ? "border-accent/20 bg-accent/10 text-accent"
          : isInvited
            ? "border-white/10 bg-white/5 text-white"
            : "border-border bg-bg text-muted"
      }`}
    >
      {status}
    </span>
  );
}

function useAdminDashboardData() {
  const { data, error, isLoading } = useSWR<AdminDashboardData>(
    "/api/admin/dashboard",
    fetcher,
    { refreshInterval: 60000 },
  );

  return {
    analyticsConfigured: data?.analyticsConfigured ?? false,
    data,
    error,
    isLoading,
    lastSynced: data?.lastSynced,
    metrics: data?.metrics ?? emptyMetrics,
    trafficSources: data?.trafficSources ?? [],
    trend: data?.trend.length ? data.trend : emptyTrend,
    waitlistUsers: data?.waitlistUsers ?? [],
  };
}

function StatusNotice({
  error,
  analyticsConfigured,
  hasData,
}: {
  error?: Error;
  analyticsConfigured: boolean;
  hasData: boolean;
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error.message}
      </div>
    );
  }

  if (hasData && !analyticsConfigured) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
        Create the Supabase analytics_events table to start collecting visitor metrics.
      </div>
    );
  }

  return null;
}

function WaitlistTable({
  users,
  isLoading,
  compact = false,
}: {
  users: WaitlistUser[];
  isLoading: boolean;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<WaitlistUser | null>(null);
  const pageSize = compact ? 5 : 8;
  const sources = [...new Set(users.map((user) => user.source))];
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = `${user.email} ${user.country} ${user.status}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesSource = source === "All sources" || user.source === source;
      return matchesQuery && matchesSource;
    });
  }, [query, source, users]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  function exportCsv() {
    const header = "Email,Date Joined,Country,Source,Status";
    const rows = filteredUsers.map((user) =>
      [user.email, user.joined, user.country, user.source, user.status].join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "questxs-waitlist.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Waitlist Users</h2>
            <p className="mt-1 text-sm text-muted">
              {isLoading ? "Loading Supabase waitlist..." : "Search, filter, export, and inspect early demand."}
            </p>
          </div>
          {!compact && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex items-center rounded-lg border border-border bg-bg px-3 py-2 text-sm text-muted">
                <Search className="mr-2 h-4 w-4" />
                <input
                  className="w-full bg-transparent text-white placeholder-muted outline-none"
                  placeholder="Search users"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label className="flex items-center rounded-lg border border-border bg-bg px-3 py-2 text-sm text-muted">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <select
                  className="bg-transparent text-white outline-none"
                  value={source}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setPage(1);
                  }}
                >
                  <option>All sources</option>
                  {sources.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button
                className="inline-flex items-center justify-center rounded-lg border border-accent/20 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent/15"
                onClick={exportCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="py-3 font-medium">Email</th>
                <th className="py-3 font-medium">Date Joined</th>
                <th className="py-3 font-medium">Country</th>
                <th className="py-3 font-medium">Source</th>
                <th className="py-3 font-medium">Status</th>
                {!compact && <th className="py-3 font-medium">Details</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageUsers.length ? (
                pageUsers.map((user) => (
                  <tr key={user.email} className="transition hover:bg-white/[0.02]">
                    <td className="py-4 pr-4 font-medium text-white">{user.email}</td>
                    <td className="py-4 pr-4 text-muted">{user.joined}</td>
                    <td className="py-4 pr-4 text-muted">{user.country}</td>
                    <td className="py-4 pr-4 text-muted">{user.source}</td>
                    <td className="py-4 pr-4">
                      <StatusPill status={user.status} />
                    </td>
                    {!compact && (
                      <td className="py-4">
                        <button
                          className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:border-accent/30 hover:text-white"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-8 text-center text-muted" colSpan={compact ? 5 : 6}>
                    No waitlist users match this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              className="rounded-lg border border-border p-2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next page"
              className="rounded-lg border border-border p-2 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Panel>

      {selectedUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold">User details</h3>
                <p className="mt-1 text-sm text-muted">{selectedUser.email}</p>
              </div>
              <button
                aria-label="Close user details"
                className="rounded-lg border border-border p-2 text-muted transition hover:text-white"
                onClick={() => setSelectedUser(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 divide-y divide-border text-sm">
              {[
                ["Date joined", selectedUser.joined],
                ["Country", selectedUser.country],
                ["Source", selectedUser.source],
                ["Status", selectedUser.status],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TrafficList({ sources }: { sources: TrafficSource[] }) {
  return (
    <div className="space-y-5">
      {sources.length ? (
        sources.map((item) => (
          <div key={item.source}>
            <div className="flex items-center justify-between text-sm">
              <span>{item.source}</span>
              <span className="text-muted">{item.sessions}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-bg">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))
      ) : (
        <p className="rounded-lg border border-border bg-bg px-4 py-6 text-center text-sm text-muted">
          Traffic source data will appear after the first tracked page view.
        </p>
      )}
    </div>
  );
}

function OverviewPage({
  analyticsConfigured,
  data,
  error,
  isLoading,
  lastSynced,
  metrics,
  trafficSources,
  trend,
  waitlistUsers,
}: ReturnType<typeof useAdminDashboardData>) {
  const metricCards = [
    ["Daily Visitors", formatNumber(metrics.dailyVisitors), "Tracked in Supabase analytics"],
    ["Monthly Visitors", formatNumber(metrics.monthlyVisitors), `${formatNumber(metrics.totalSessions)} sessions this month`],
    ["Waitlist Signups", formatNumber(metrics.totalSignups), `${formatNumber(metrics.dailySignups)} today`],
    ["Conversion Rate", `${metrics.conversionRate}%`, "Monthly visitor to signup rate"],
    ["Returning Users", formatNumber(metrics.returningVisitors), "Visitors with repeat sessions"],
    ["Average Session Time", metrics.averageSessionTime, "Measured from session end events"],
  ];

  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="Investor-ready metrics"
        title="Overview"
        description="A focused operating pulse for QuestXS growth, waitlist momentum, and platform health."
        aside={
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-xs text-muted">Last synced</p>
            <p className="mt-1 font-display text-lg font-semibold">{formatLastSynced(lastSynced)}</p>
          </div>
        }
      />
      <StatusNotice error={error} analyticsConfigured={analyticsConfigured} hasData={Boolean(data)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map(([label, value, detail]) => (
          <MetricCard key={label} label={label} value={value} detail={detail} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <LineChart
          title="Growth summary"
          subtitle="Unique visitors over the last seven days"
          dataKey="visitors"
          data={trend}
        />
        <Panel>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-semibold">Platform Health</h2>
          </div>
          <div className="mt-5 divide-y divide-border text-sm">
            {[
              ["Supabase", error ? "Needs attention" : "Connected"],
              ["Analytics", analyticsConfigured ? "Live" : "Table required"],
              ["Waitlist", isLoading ? "Syncing" : `${formatNumber(waitlistUsers.length)} users`],
              ["Traffic", `${formatNumber(trafficSources.length)} active sources`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-muted">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <WaitlistTable users={waitlistUsers.slice(0, 5)} isLoading={isLoading} compact />
        <Panel>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-semibold">Analytics Snapshot</h2>
          </div>
          <div className="mt-6">
            <TrafficList sources={trafficSources.slice(0, 4)} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function WaitlistPage(props: ReturnType<typeof useAdminDashboardData>) {
  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="Demand operations"
        title="Waitlist Users"
        description="Manage early access demand, inspect acquisition context, and export users for launch operations."
      />
      <WaitlistTable users={props.waitlistUsers} isLoading={props.isLoading} />
    </div>
  );
}

function AnalyticsPage({ metrics, trend }: ReturnType<typeof useAdminDashboardData>) {
  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="Growth intelligence"
        title="Analytics"
        description="Track visitor growth, waitlist velocity, conversion quality, and growth momentum."
        aside={
          <select className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-white outline-none">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
          </select>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Visitors" value={formatNumber(metrics.monthlyVisitors)} detail="Unique monthly visitors" />
        <MetricCard label="Sessions" value={formatNumber(metrics.totalSessions)} detail="Tracked sessions" />
        <MetricCard label="Signups" value={formatNumber(metrics.monthlySignups)} detail="Monthly waitlist joins" />
        <MetricCard label="Conversion" value={`${metrics.conversionRate}%`} detail="Visitor to signup" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LineChart title="Visitor growth" subtitle="Unique visitors by day" dataKey="visitors" data={trend} />
        <LineChart title="Signup trend" subtitle="Waitlist signups by day" dataKey="waitlist" data={trend} />
        <LineChart title="Conversion trend" subtitle="Daily visitor to signup rate" dataKey="conversion" data={trend} />
        <LineChart title="Returning users" subtitle="Repeat session movement" dataKey="returning" data={trend} />
      </div>
    </div>
  );
}

function TrafficPage({ trafficSources }: ReturnType<typeof useAdminDashboardData>) {
  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="Attribution"
        title="Traffic Sources"
        description="Understand where demand is coming from and which channels deserve operational focus."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Panel>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-semibold">Channel Mix</h2>
          </div>
          <div className="mt-6">
            <TrafficList sources={trafficSources} />
          </div>
        </Panel>
        <Panel>
          <h2 className="font-display text-xl font-semibold">Campaign Performance</h2>
          <div className="mt-5 divide-y divide-border text-sm">
            {(trafficSources.length ? trafficSources : [{ source: "No campaigns yet", value: 0, sessions: "0" }]).map((item) => (
              <div key={item.source} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{item.source}</p>
                  <p className="mt-1 text-xs text-muted">UTM / referral source</p>
                </div>
                <span className="text-accent">{item.value}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EngagementPage({ metrics, trend }: ReturnType<typeof useAdminDashboardData>) {
  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="Behavior"
        title="Engagement"
        description="Measure session quality, return behavior, bounce patterns, and depth of early product interest."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Avg. Session" value={metrics.averageSessionTime} detail="Session end events" />
        <MetricCard label="Bounce Rate" value={`${metrics.bounceRate}%`} detail="Single-page sessions" />
        <MetricCard label="Pages / Visit" value={String(metrics.pagesPerSession)} detail="Engagement depth" />
        <MetricCard label="Returning Users" value={formatNumber(metrics.returningVisitors)} detail="Repeat sessions" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LineChart title="Returning visitor trend" subtitle="Repeat session movement" dataKey="returning" data={trend} />
        <Panel>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-semibold">Usage Patterns</h2>
          </div>
          <div className="mt-5 divide-y divide-border text-sm">
            {[
              ["High intent sessions", `${metrics.pagesPerSession} pages per visit`],
              ["Retention signal", `${formatNumber(metrics.returningVisitors)} returning users`],
              ["Session quality", metrics.averageSessionTime],
              ["Friction signal", `${metrics.bounceRate}% bounce rate`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-4">
                <span className="text-muted">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EmailsPage({ metrics }: ReturnType<typeof useAdminDashboardData>) {
  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="Communications"
        title="Emails"
        description="Prepare launch updates, waitlist announcements, and beta invitation campaigns."
      />
      <BroadcastCenter fallbackRecipientCount={metrics.totalSignups} />
    </div>
  );
}

function SettingsPage({ analyticsConfigured, error }: ReturnType<typeof useAdminDashboardData>) {
  return (
    <div className="animate-fade-up space-y-6 opacity-0">
      <PageHeader
        badge="System"
        title="Settings"
        description="Manage integrations, security posture, branding controls, and operational configuration."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            title: "Integrations",
            rows: [
              ["Supabase", error ? "Needs attention" : "Connected"],
              ["Analytics", analyticsConfigured ? "Live" : "Create table"],
              ["Vercel Analytics", "Installed"],
              ["Email provider", "Configured"],
            ],
          },
          {
            title: "Admin Profile",
            rows: [
              ["Role", "Founder admin"],
              ["Session", "Supabase Auth"],
              ["Access list", "ADMIN_ALLOWED_EMAILS"],
              ["Logout", "Available"],
            ],
          },
          {
            title: "Security",
            rows: [
              ["Route protection", "Middleware"],
              ["Server validation", "Enabled"],
              ["Secret exposure", "Server-only"],
              ["Dashboard API", "Protected"],
            ],
          },
        ].map((group) => (
          <Panel key={group.title}>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-accent" />
              <h2 className="font-display text-xl font-semibold">{group.title}</h2>
            </div>
            <div className="mt-5 divide-y divide-border text-sm">
              {group.rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-4">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function renderPage(page: AdminPageKey, data: ReturnType<typeof useAdminDashboardData>) {
  switch (page) {
    case "waitlist":
      return <WaitlistPage {...data} />;
    case "analytics":
      return <AnalyticsPage {...data} />;
    case "traffic":
      return <TrafficPage {...data} />;
    case "engagement":
      return <EngagementPage {...data} />;
    case "emails":
      return <EmailsPage {...data} />;
    case "settings":
      return <SettingsPage {...data} />;
    case "overview":
    default:
      return <OverviewPage {...data} />;
  }
}

export default function AdminDashboard({ page = "overview" }: { page?: AdminPageKey }) {
  const data = useAdminDashboardData();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/admin/signin";
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="fixed left-[-12rem] top-24 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="fixed right-[-14rem] top-1/3 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-bg/95 px-4 py-5 backdrop-blur transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-bold tracking-wide">QUESTXS</p>
            <p className="mt-1 text-xs uppercase tracking-[0.32em] text-muted">Admin</p>
          </div>
          <button
            aria-label="Close navigation"
            className="rounded-lg border border-border p-2 text-muted transition hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition ${
                  active
                    ? "border-accent/20 bg-accent/10 text-white"
                    : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span>{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium">Platform Health</p>
              <p className="text-xs text-muted">
                {data.error ? "Supabase sync needs attention" : "All systems nominal"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                className="rounded-lg border border-border p-2 text-muted transition hover:text-white lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="font-display text-base font-semibold">Growth Control Center</p>
                <p className="hidden text-xs text-muted sm:block">
                  Realtime waitlist and acquisition intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted md:flex">
                <Search className="mr-2 h-4 w-4" />
                Search metrics
              </div>
              <button aria-label="Notifications" className="rounded-lg border border-border bg-surface p-2 text-muted transition hover:text-white">
                <Bell className="h-4 w-4" />
              </button>
              <button
                aria-label="Sign out"
                className="rounded-lg border border-border bg-surface p-2 text-muted transition hover:text-white"
                onClick={() => {
                  void handleSignOut();
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 font-display text-sm font-semibold text-accent">
                QX
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{renderPage(page, data)}</main>
      </div>
    </div>
  );
}
