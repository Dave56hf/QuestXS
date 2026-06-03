import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { API_LIMITS, getTierForRank, maskEmail } from "@/lib/config";

export const dynamic = "force-dynamic";

type LeaderboardUser = {
  email: string;
  referral_code: string;
  total_points: number;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    const url = new URL(req.url);
    const code = url.searchParams.get("code")?.trim().toUpperCase() ?? null;

    // Get top 100 users ordered by total_points descending
    const { data: users, error } = await supabase
      .from("users")
      .select("referral_code, email, total_points")
      .order("total_points", { ascending: false })
      .limit(API_LIMITS.leaderboard);

    if (error) {
      throw error;
    }

    // Optionally include the current user even if they are not in the top 100.
    let currentUser: LeaderboardUser | null = null;
    let currentUserRank: number | null = null;
    if (code) {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("referral_code, email, total_points")
        .eq("referral_code", code)
        .maybeSingle();

      if (userError) {
        throw userError;
      }
      currentUser = userRow ?? null;

      if (currentUser) {
        const { count: rankCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gt("total_points", currentUser.total_points);

        currentUserRank = (rankCount ?? 0) + 1;
      }
    }

    const topList = users ?? [];

    // Whether the current user already appears in the top list
    const currentUserInTopList =
      currentUser &&
      topList.some((u) => u.referral_code === currentUser.referral_code);

    const merged = (() => {
      const map = new Map<string, LeaderboardUser>();
      for (const u of topList) {
        if (u?.referral_code) map.set(u.referral_code, u);
      }
      // Append current user only if outside the top list
      if (currentUser?.referral_code && !currentUserInTopList)
        map.set(currentUser.referral_code, currentUser);
      return Array.from(map.values());
    })();

    // Sort descending by points
    merged.sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0));

    const leaderboard = merged.map((user, index) => {
      const isCurrentUser = user.referral_code === currentUser?.referral_code;

      // Use the DB-calculated rank only when the current user was appended
      // (i.e. they are outside the top list). Everyone in the top list gets
      // a clean sequential rank based on their sorted position.
      const rank =
        isCurrentUser && !currentUserInTopList && currentUserRank
          ? currentUserRank
          : index + 1;

      return {
        rank,
        display: maskEmail(user.email),
        referral_code: user.referral_code,
        total_points: user.total_points,
        tier: getTierForRank(rank),
      };
    });

    return NextResponse.json(
      leaderboard.slice(0, API_LIMITS.leaderboardWithCurrentUser),
      { status: 200 },
    );
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
