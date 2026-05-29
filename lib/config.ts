export const QUESTXS_APP = {
  name: "QuestXS",
  publicBaseUrl: "https://quest-xs.vercel.app",
  dashboardCodeStorageKey: "questxs_dashboard_code",
  analyticsSessionStorageKey: "questxs_session_id",
  analyticsVisitorStorageKey: "questxs_visitor_id",
} as const;

export const EXTERNAL_ENDPOINTS = {
  coingeckoBaseUrl: "https://api.coingecko.com/api/v3",
  fearGreedUrl: "https://api.alternative.me/fng/",
} as const;

export const CACHE_REVALIDATE_SECONDS = {
  fearGreed: 3600,
  market: 60,
  movers: 60,
  trending: 300,
} as const;

export const MARKET_LIMITS = {
  moversPerPage: 100,
  moversSection: 5,
  trendingPreview: 5,
  trendingCoins: 6,
} as const;

export const API_LIMITS = {
  leaderboard: 100,
  leaderboardWithCurrentUser: 101,
  sessionReferrals: 25,
  userReferrals: 25,
  broadcastDrafts: 50,
  broadcastLogs: 8,
  adminDashboardRows: 1000,
  adminAnalyticsRows: 5000,
  broadcastRecipients: 5000,
  broadcastBatchSize: 25,
} as const;

export const REFERRAL_CODE = {
  prefix: "QUEST-",
  length: 6,
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
} as const;

export const QUEST_POINTS = {
  joinWaitlist: 100,
  followX: 75,
  retweet: 100,
  discord: 75,
  wallet: 300,
  referral: 250,
  refer5Bonus: 500,
  refer10Bonus: 1500,
} as const;

export type QuestTaskAction = "external" | "verify" | "wallet" | "auto";

export type QuestTask = {
  type: string;
  name: string;
  points: number;
  action: QuestTaskAction;
  url?: string;
};

export const QUEST_TASKS: QuestTask[] = [
  {
    type: "join_waitlist",
    name: "Join Waitlist",
    points: QUEST_POINTS.joinWaitlist,
    action: "auto",
  },
  {
    type: "follow_x",
    name: "Follow @Questcac",
    points: QUEST_POINTS.followX,
    action: "external",
    url: "https://x.com/Questcac?s=20",
  },
  {
    type: "retweet",
    name: "Retweet Pinned Post",
    points: QUEST_POINTS.retweet,
    action: "external",
    url: "https://x.com/Questcac/status/2059706838573297948",
  },
  {
    type: "wallet",
    name: "Connect Wallet",
    points: QUEST_POINTS.wallet,
    action: "wallet",
  },
  {
    type: "refer_5_bonus",
    name: "Refer 5 Friends",
    points: QUEST_POINTS.refer5Bonus,
    action: "auto",
  },
  {
    type: "refer_10_bonus",
    name: "Refer 10 Friends",
    points: QUEST_POINTS.refer10Bonus,
    action: "auto",
  },
];

export const TASK_POINTS = QUEST_TASKS.reduce<Record<string, number>>(
  (points, task) => {
    points[task.type] = task.points;
    return points;
  },
  {},
);

export const REFERRAL_BONUSES = new Map<number, number>([
  [5, QUEST_POINTS.refer5Bonus],
  [10, QUEST_POINTS.refer10Bonus],
]);

export const REFERRAL_MILESTONES = Array.from(REFERRAL_BONUSES.entries()).map(
  ([referrals, points]) => ({ referrals, points }),
);

export const TIERS = [
  { name: "CONTRIBUTOR", maxRank: Infinity },
  { name: "EARLY CONTRIBUTOR", maxRank: 500 },
  { name: "TOP 100", maxRank: 100 },
  { name: "ELITE", maxRank: 50 },
  { name: "LEGEND", maxRank: 10 },
] as const;

export type QuestTier = (typeof TIERS)[number]["name"];

export function getTierForRank(rank: number): QuestTier {
  if (rank <= 10) return "LEGEND";
  if (rank <= 50) return "ELITE";
  if (rank <= 100) return "TOP 100";
  if (rank <= 500) return "EARLY CONTRIBUTOR";
  return "CONTRIBUTOR";
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

export function getReferralLink(referralCode: string, origin?: string): string {
  const baseUrl = origin || QUESTXS_APP.publicBaseUrl;
  return `${baseUrl}/waitlist?ref=${referralCode}`;
}

export const TOTAL_TASK_POINTS = QUEST_TASKS.reduce(
  (total, task) => total + task.points,
  0,
);
