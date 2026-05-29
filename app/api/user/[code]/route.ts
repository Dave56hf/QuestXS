import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { API_LIMITS, getTierForRank, maskEmail } from "@/lib/config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: "Referral code is required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Find user by referral code
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, total_points, referral_code")
      .eq("referral_code", code)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Get user rank
    const { count: rankCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("total_points", user.total_points);

    const rank = (rankCount ?? 0) + 1;

    // Get completed tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("task_type")
      .eq("user_id", user.id);

    const completedTasks = (tasks ?? []).map((t) => t.task_type);

    // Get referral count and recent referral records
    const { data: referrals, count: referralCount } = await supabase
      .from("referrals")
      .select("referee_email, points_awarded", { count: "exact" })
      .eq("referrer_code", code)
      .order("referee_email", { ascending: true })
      .limit(API_LIMITS.userReferrals);

    return NextResponse.json(
      {
        display: maskEmail(user.email),
        total_points: user.total_points,
        rank,
        referral_code: user.referral_code,
        completed_tasks: completedTasks,
        referral_count: referralCount ?? 0,
        referrals: (referrals ?? []).map((referral) => ({
          display: maskEmail(referral.referee_email),
          points_awarded: referral.points_awarded,
        })),
        tier: getTierForRank(rank),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("User fetch error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
