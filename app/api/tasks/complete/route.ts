import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

const TASK_POINTS: Record<string, number> = {
  follow_x: 75,
  retweet: 100,
  discord: 75,
};

async function getRank(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  totalPoints: number,
) {
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("total_points", totalPoints);

  return (count ?? 0) + 1;
}

export async function POST(req: NextRequest) {
  try {
    const { referralCode, taskType } = (await req.json()) as {
      referralCode?: string;
      taskType?: string;
    };

    if (!referralCode || !taskType) {
      return NextResponse.json(
        { error: "Referral code and task type are required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, total_points")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const pointsAwarded = TASK_POINTS[taskType] ?? 0;
    if (pointsAwarded === 0) {
      return NextResponse.json(
        { error: "Invalid task type." },
        { status: 400 },
      );
    }

    const { data: existingTask } = await supabase
      .from("tasks")
      .select("id, points_awarded")
      .eq("user_id", user.id)
      .eq("task_type", taskType)
      .maybeSingle();

    if (existingTask) {
      return NextResponse.json(
        {
          alreadyCompleted: true,
          newTotal: user.total_points,
          pointsAwarded: 0,
          rank: await getRank(supabase, user.total_points),
        },
        { status: 200 },
      );
    }

    const { error: taskError } = await supabase.from("tasks").insert([
      {
        user_id: user.id,
        task_type: taskType,
        points_awarded: pointsAwarded,
      },
    ]);

    if (taskError) {
      throw taskError;
    }

    // Atomically increment user's total_points via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "increment_user_points",
      {
        _user_id: user.id,
        _delta: pointsAwarded,
      },
    );

    if (rpcError) {
      console.error("RPC increment error:", rpcError);
      throw rpcError;
    }

    const newTotal = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    return NextResponse.json(
      {
        alreadyCompleted: false,
        newTotal,
        pointsAwarded,
        rank: await getRank(supabase, Number(newTotal)),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Task completion error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
