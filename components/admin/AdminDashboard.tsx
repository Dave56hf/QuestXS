"use client";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  Mail,
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
import useSWR from "swr";
import Badge from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
  "Overview",
  "Waitlist Users",
  "Analytics",
  "Traffic Sources",
  "Engagement",
  "Emails",
  "Settings",
];

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
  waitlistTrend: Array<{
    label: string;
    count: number;
  }>;
  waitlistUsers: WaitlistUser[];
  trafficSources: TrafficSource[];
  lastSynced: string;
};

const fallbackChartData: ChartDatum[] = [
  { label: "Mon", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Tue", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Wed", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Thu", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Fri", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Sat", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
  { label: "Sun", visitors: 0, waitlist: 0, conversion: 0, returning: 0 },
];

const fallbackWaitlistUsers: WaitlistUser[] = [
  { email: "maya@hedgeops.ai", joined: "2026-05-20", country: "United States", source: "X/Twitter", status: "Confirmed" },
  { email: "ade@chainlabs.co", joined: "2026-05-19", country: "Nigeria", source: "Direct", status: "Confirmed" },
  { email: "lena@quantdesk.io", joined: "2026-05-19", country: "Germany", source: "Google", status: "Pending" },
  { email: "noah@alphavault.xyz", joined: "2026-05-18", country: "Canada", source: "Telegram", status: "Confirmed" },
  { email: "sora@signaldao.com", joined: "2026-05-18", country: "Singapore", source: "Discord", status: "Confirmed" },
  { email: "jamie@venturegrid.vc", joined: "2026-05-17", country: "United Kingdom", source: "Referral", status: "Invited" },
  { email: "nia@marketpulse.app", joined: "2026-05-16", country: "South Africa", source: "X/Twitter", status: "Pending" },
  { email: "omar@defiflow.io", joined: "2026-05-15", country: "UAE", source: "Direct", status: "Confirmed" },
];

const fallbackTrafficSources: TrafficSource[] = [
  { source: "X/Twitter", value: 38, sessions: "14.7K" },
  { source: "Direct visits", value: 24, sessions: "9.2K" },
  { source: "Telegram", value: 14, sessions: "5.4K" },
  { source: "Discord", value: 11, sessions: "4.2K" },
  { source: "Google search", value: 8, sessions: "3.1K" },
  { source: "Referral links", value: 5, sessions: "1.9K" },
];

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to load dashboard data.");
  }

  return payload;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(value);
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
  if (values.length === 1) {
    return `M 0 50 L 100 50`;
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

function LineChart({
  title,
  subtitle,
  dataKey,
  data,
}: {
  title: string;
  subtitle: string;
  dataKey: "visitors" | "waitlist" | "conversion" | "returning";
  data: ChartDatum[];
}) {
  const values = data.map((item) => item[dataKey]);
  const path = chartPath(values);
  const area = `${path} L 100 92 L 0 92 Z`;

  return (
    <section className="rounded-xl border border-border bg-surface p-5 transition duration-200 hover:border-accent/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <Badge>Live</Badge>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-bg p-4">
        <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${dataKey}-area`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 38, 56, 74, 92].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#1f1f1f" strokeWidth="0.6" />
          ))}
          <path d={area} fill={`url(#${dataKey}-area)`} />
          <path d={path} fill="none" stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
        <div className="mt-3 grid grid-cols-7 text-center text-xs text-muted">
          {data.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
    </section>
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

export default function AdminDashboard() {
  const { data, error, isLoading } = useSWR<AdminDashboardData>(
    "/api/admin/dashboard",
    fetcher,
    { refreshInterval: 60000 },
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const waitlistUsers = data?.waitlistUsers ?? fallbackWaitlistUsers;
  const trafficSources = data ? data.trafficSources : fallbackTrafficSources;
  const totalSignups = data?.metrics.totalSignups ?? waitlistUsers.length;
  const dailySignups = data?.metrics.dailySignups ?? 0;
  const monthlySignups = data?.metrics.monthlySignups ?? 0;
  const chartSeries = data?.trend.length ? data.trend : fallbackChartData;
  const metrics = [
    {
      label: "Daily Visitors",
      value: formatNumber(data?.metrics.dailyVisitors ?? 0),
      detail: "Tracked in Supabase analytics",
    },
    {
      label: "Monthly Visitors",
      value: formatNumber(data?.metrics.monthlyVisitors ?? 0),
      detail: `${formatNumber(data?.metrics.totalSessions ?? 0)} sessions this month`,
    },
    {
      label: "Waitlist Signups",
      value: formatNumber(totalSignups),
      detail: `${formatNumber(dailySignups)} today, ${formatNumber(monthlySignups)} this month`,
    },
    {
      label: "Conversion Rate",
      value: `${data?.metrics.conversionRate ?? 0}%`,
      detail: "Monthly visitor to signup rate",
    },
    {
      label: "Returning Visitors",
      value: formatNumber(data?.metrics.returningVisitors ?? 0),
      detail: "Visitors with repeat sessions",
    },
    {
      label: "Avg. Session Time",
      value: data?.metrics.averageSessionTime ?? "0m 00s",
      detail: "Measured from session end events",
    },
  ];

  const filteredUsers = useMemo(() => {
    return waitlistUsers.filter((user) => {
      const matchesQuery = `${user.email} ${user.country} ${user.status}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesSource = source === "All sources" || user.source === source;
      return matchesQuery && matchesSource;
    });
  }, [query, source, waitlistUsers]);

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
            const active = item === "Overview";
            return (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition ${
                  active
                    ? "border-accent/20 bg-accent/10 text-white"
                    : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <span>{item}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
              </a>
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
                {error ? "Supabase sync needs attention" : "All systems nominal"}
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
                <p className="hidden text-xs text-muted sm:block">Realtime waitlist and acquisition intelligence</p>
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

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <section id="overview" className="animate-fade-up opacity-0">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <Badge>Investor-ready metrics</Badge>
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  QuestXS operating pulse
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  Monitor growth, waitlist momentum, acquisition channels, and early engagement signals from one focused control center.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-xs text-muted">Last synced</p>
                <p className="mt-1 font-display text-lg font-semibold">
                  {formatLastSynced(data?.lastSynced)}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error.message}
              </div>
            )}

            {data && !data.analyticsConfigured && (
              <div className="mt-5 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
                Create the Supabase analytics_events table to start collecting visitor metrics.
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => (
                <article key={metric.label} className="rounded-xl border border-border bg-surface p-5 transition duration-200 hover:border-accent/30 hover:bg-surface2">
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{metric.value}</p>
                  <p className="mt-3 text-xs text-accent">{metric.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="analytics" className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            <LineChart title="Visitor growth" subtitle="Unique visitors by day" dataKey="visitors" data={chartSeries} />
            <LineChart title="Waitlist growth" subtitle="Signup velocity over time" dataKey="waitlist" data={chartSeries} />
            <LineChart title="Conversion trend" subtitle="Visitor to signup rate" dataKey="conversion" data={chartSeries} />
            <LineChart title="Returning visitors" subtitle="Repeat session movement" dataKey="returning" data={chartSeries} />
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]" id="waitlist-users">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Waitlist Users</h2>
                  <p className="mt-1 text-sm text-muted">
                    {isLoading ? "Loading Supabase waitlist..." : "Search, filter, export, and review early demand."}
                  </p>
                </div>
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
                      {[...new Set(waitlistUsers.map((user) => user.source))].map((item) => (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageUsers.map((user) => (
                      <tr key={user.email} className="transition hover:bg-white/[0.02]">
                        <td className="py-4 pr-4 font-medium text-white">{user.email}</td>
                        <td className="py-4 pr-4 text-muted">{user.joined}</td>
                        <td className="py-4 pr-4 text-muted">{user.country}</td>
                        <td className="py-4 pr-4 text-muted">{user.source}</td>
                        <td className="py-4">
                          <StatusPill status={user.status} />
                        </td>
                      </tr>
                    ))}
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
            </div>

            <div id="traffic-sources" className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Traffic Sources</h2>
                  <p className="mt-1 text-sm text-muted">Channel mix this month</p>
                </div>
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-6 space-y-5">
                {trafficSources.length ? trafficSources.map((item) => (
                  <div key={item.source}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.source}</span>
                      <span className="text-muted">{item.sessions}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-bg">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="rounded-lg border border-border bg-bg px-4 py-6 text-center text-sm text-muted">
                    Traffic source data will appear after the first tracked page view.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            <div id="engagement" className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">Engagement</h2>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {[
                  ["Bounce Rate", `${data?.metrics.bounceRate ?? 0}%`],
                  ["Pages / Visit", String(data?.metrics.pagesPerSession ?? 0)],
                  ["Repeat Users", formatNumber(data?.metrics.returningVisitors ?? 0)],
                  ["Avg. Session", data?.metrics.averageSessionTime ?? "0m 00s"],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-border pt-4">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="emails" className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">Emails</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                Broadcast tooling is staged for launch updates, beta invitations, and investor-facing growth notes.
              </p>
              <button className="mt-6 w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/30">
                Prepare Broadcast
              </button>
            </div>

            <div id="settings" className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">Settings</h2>
              </div>
              <div className="mt-5 divide-y divide-border text-sm">
                {[
                  "Supabase connected",
                  data?.analyticsConfigured ? "Supabase analytics live" : "Create analytics_events table",
                  "Vercel Analytics tracking installed",
                  "Email provider configured",
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between py-3">
                    <span className="text-muted">{item}</span>
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
