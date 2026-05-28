import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  ensureAnonIdInResponse,
  getAnonIdFromRequest,
} from "@/lib/identity/anon-cookie";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminClient();

  try {
    // Ensure the cookie exists so we have a stable anonymous identity.
    const response = new NextResponse();
    const anonId = ensureAnonIdInResponse(req, response);

    // Resolve anonId -> user.
    const { data: identityRow, error: identityError } = await supabase
      .from("anon_identities")
      .select("user_id")
      .eq("anon_id", anonId)
      .maybeSingle();

    if (identityError) {
      return NextResponse.json(
        { error: identityError.message },
        { status: 500 },
      );
    }

    if (!identityRow?.user_id) {
      // No mapping yet; caller can bootstrap with ?code=... (one-time).
      return NextResponse.json(
        { user: null },
        { status: 200, headers: response.headers },
      );
    }

    const userId = identityRow.user_id;

    // Fetch user.
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, total_points, referral_code")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    // Rank.
    const { count: rankCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("total_points", user.total_points);

    const rank = (rankCount ?? 0) + 1;

    // Tasks.
    const { data: tasks } = await supabase
      .from("tasks")
      .select("task_type")
      .eq("user_id", user.id);

    const completedTasks = (tasks ?? []).map((t) => t.task_type);

    // Referrals.
    const { data: referrals, count: referralCount } = await supabase
      .from("referrals")
      .select("referee_email, points_awarded", { count: "exact" })
      .eq("referrer_code", user.referral_code)
      .order("referee_email", { ascending: true });

    // Tier.
    let tier = "CONTRIBUTOR";
    if (rank <= 10) tier = "LEGEND";
    else if (rank <= 50) tier = "ELITE";
    else if (rank <= 100) tier = "TOP 100";
    else if (rank <= 500) tier = "EARLY CONTRIBUTOR";

    const maskEmail = (email: string) => {
      const [local, domain] = email.split("@");
      if (!domain) return email;
      return local.slice(0, 2) + "***@" + domain;
    };

    return NextResponse.json(
      {
        user: {
          display: maskEmail(user.email),
          total_points: user.total_points,
          rank,
          referral_code: user.referral_code,
          completed_tasks: completedTasks,
          referral_count: referralCount ?? 0,
          referrals: (referrals ?? []).map((r) => ({
            display: maskEmail(r.referee_email),
            points_awarded: r.points_awarded,
          })),
          tier,
        },
        anonId,
      },
      { status: 200, headers: response.headers },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to load session." },
      { status: 500 },
    );
  }
}
