import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { QUEST_POINTS } from "@/lib/config";

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

export async function PATCH(req: NextRequest) {
  try {
    const { referralCode, walletAddress } = (await req.json()) as {
      referralCode?: string;
      walletAddress?: string;
    };

    if (!referralCode || !walletAddress) {
      return NextResponse.json(
        { error: "Referral code and wallet address are required." },
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

    const { error: walletError } = await supabase
      .from("users")
      .update({ wallet_address: walletAddress })
      .eq("referral_code", referralCode);

    if (walletError) {
      throw walletError;
    }

    const { data: existingTask } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_type", "wallet")
      .maybeSingle();

    let newTotal = user.total_points;
    let pointsAwarded = 0;
    let alreadyCompleted = Boolean(existingTask);

    if (!existingTask) {
      pointsAwarded = QUEST_POINTS.wallet;

      const { error: taskError } = await supabase.from("tasks").insert([
        {
          user_id: user.id,
          task_type: "wallet",
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

      newTotal = Array.isArray(rpcData) ? rpcData[0] : rpcData;

      alreadyCompleted = false;
    }

    return NextResponse.json(
      {
        alreadyCompleted,
        newTotal,
        pointsAwarded,
        rank: await getRank(supabase, Number(newTotal)),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Wallet update error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
