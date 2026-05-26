import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type TaskType =
  | "follow_x"
  | "retweet"
  | "discord"
  | "wallet"
  | "referral_5"
  | "referral_10";

type Body = {
  referralCode?: string;
  taskType?: TaskType;
};

const pointsForTask: Record<TaskType, number> = {
  follow_x: 75,
  retweet: 100,
  discord: 75,
  wallet: 300,
  referral_5: 0, // bonus awarded via join route; included for completeness
  referral_10: 0, // bonus awarded via join route; included for completeness
};

export async function POST(req: NextRequest) {
  try {
    const { referralCode, taskType } = (await req.json()) as Body;

    if (!referralCode || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, total_points")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Idempotency: only award if not already completed.
    const { data: existingTask, error: taskFindError } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_type", taskType)
      .maybeSingle();

    if (taskFindError) {
      return NextResponse.json(
        { error: taskFindError.message },
        { status: 500 },
      );
    }

    if (existingTask) {
      return NextResponse.json(
        {
          newTotal: user.total_points,
          pointsAwarded: 0,
          rank: null,
        },
        { status: 200 },
      );
    }

    const pointsAwarded = pointsForTask[taskType];

    // Insert task
    const { error: insertError } = await supabase.from("tasks").insert([
      {
        user_id: user.id,
        task_type: taskType,
        points_awarded: pointsAwarded,
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const updatedTotal = (user.total_points ?? 0) + pointsAwarded;

    const { error: updateError } = await supabase
      .from("users")
      .update({ total_points: updatedTotal })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Rank
    const { data: higher, error: rankError } = await supabase
      .from("users")
      .select("id")
      .gt("total_points", updatedTotal);

    if (rankError) {
      return NextResponse.json({ error: rankError.message }, { status: 500 });
    }

    const rank = (higher?.length ?? 0) + 1;

    return NextResponse.json({ newTotal: updatedTotal, pointsAwarded, rank });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to complete task." },
      { status: 500 },
    );
  }
}
