import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return local.slice(0, 2) + "***@" + domain;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    // Get top 100 users ordered by total_points descending
    const { data: users, error } = await supabase
      .from("users")
      .select("referral_code, email, total_points")
      .order("total_points", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    const leaderboard = (users ?? []).map((user, index) => {
      const rank = index + 1;
      let tier = "CONTRIBUTOR";

      if (rank <= 10) {
        tier = "LEGEND";
      } else if (rank <= 50) {
        tier = "ELITE";
      } else if (rank <= 100) {
        tier = "TOP 100";
      } else if (rank <= 500) {
        tier = "EARLY CONTRIBUTOR";
      }

      return {
        rank,
        display: maskEmail(user.email),
        referral_code: user.referral_code,
        total_points: user.total_points,
        tier,
      };
    });

    return NextResponse.json(leaderboard, { status: 200 });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
