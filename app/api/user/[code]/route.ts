import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function maskEmail(email: string) {
  const parts = email.split("@");
  const local = parts[0] ?? "";
  const domain = parts[1] ?? "";
  const head = local.slice(0, 2);
  return `${head}${"***"}@${domain}`;
}

type TaskType =
  | "follow_x"
  | "retweet"
  | "discord"
  | "wallet"
  | "referral_5"
  | "referral_10";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  try {
    const supabase = getSupabaseAdminClient();
    const code = params.code;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, referral_code, total_points")
      .eq("referral_code", code)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const totalPoints = (user.total_points ?? 0) as number;

    const { data: higher } = await supabase
      .from("users")
      .select("id")
      .gt("total_points", totalPoints);

    const rank = (higher?.length ?? 0) + 1;

    const tier =
      rank <= 10
        ? "LEGEND"
        : rank <= 50
          ? "ELITE"
          : rank <= 100
            ? "TOP 100"
            : rank <= 500
              ? "EARLY CONTRIBUTOR"
              : "CONTRIBUTOR";

    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("task_type")
      .eq("user_id", user.id);

    const completedTaskTypes = new Set(
      (completedTasks ?? []).map((t: { task_type: TaskType }) => t.task_type),
    );

    const { data: referralRows } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_code", user.referral_code);

    const referralCount = (referralRows ?? []).length;

    const display = user.email
      ? maskEmail(user.email as string)
      : (user.referral_code as string);

    return NextResponse.json({
      display,
      total_points: totalPoints,
      rank,
      referral_code: user.referral_code,
      completed_tasks: Array.from(completedTaskTypes),
      referral_count: referralCount,
      tier,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to load user." },
      { status: 500 },
    );
  }
}
