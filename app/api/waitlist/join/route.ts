import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  QUEST_POINTS,
  REFERRAL_BONUSES,
  REFERRAL_CODE,
} from "@/lib/config";

function generateReferralCode(): string {
  const code =
    REFERRAL_CODE.prefix +
    Array.from(
      { length: REFERRAL_CODE.length },
      () =>
        REFERRAL_CODE.alphabet[
          Math.floor(Math.random() * REFERRAL_CODE.alphabet.length)
        ],
    ).join("");
  return code;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeReferralCode(code?: string) {
  const normalized = code?.trim().toUpperCase();
  return normalized || null;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, referredBy } = (await req.json()) as {
      email?: string;
      name?: string;
      role?: string;
      referredBy?: string;
    };

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const requestedReferrerCode = normalizeReferralCode(referredBy);
    const supabase = getSupabaseAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("referral_code, total_points")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          referralCode: existingUser.referral_code,
          totalPoints: existingUser.total_points,
          referralTracked: false,
          reason: "existing_user",
        },
        { status: 200 },
      );
    }

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let codeExists = true;
    while (codeExists) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (!data) {
        codeExists = false;
      } else {
        referralCode = generateReferralCode();
      }
    }

    const { data: referrer } = requestedReferrerCode
      ? await supabase
          .from("users")
          .select("id, email, total_points, referral_code")
          .eq("referral_code", requestedReferrerCode)
          .maybeSingle()
      : { data: null };

    const validReferrer =
      referrer && referrer.email !== normalizedEmail ? referrer : null;

    // Insert new user with 100 points
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email: normalizedEmail,
          referral_code: referralCode,
          referred_by: validReferrer?.referral_code ?? null,
          total_points: QUEST_POINTS.joinWaitlist,
        },
      ])
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    await supabase.from("tasks").insert([
      {
        user_id: newUser.id,
        task_type: "join_waitlist",
        points_awarded: QUEST_POINTS.joinWaitlist,
      },
    ]);

    let referralTracked = false;
    let referralCount = 0;
    let bonusAwarded = 0;

    if (validReferrer) {
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id")
        .eq("referee_email", normalizedEmail)
        .maybeSingle();

      if (!existingReferral) {
        const { error: referralError } = await supabase
          .from("referrals")
          .insert([
            {
              referrer_code: validReferrer.referral_code,
              referee_email: normalizedEmail,
              points_awarded: QUEST_POINTS.referral,
            },
          ]);

        if (referralError) {
          throw referralError;
        }

        referralTracked = true;

        const { count } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referrer_code", validReferrer.referral_code);

        referralCount = count ?? 0;
        bonusAwarded = REFERRAL_BONUSES.get(referralCount) ?? 0;

        await supabase
          .from("users")
          .update({
            total_points:
              validReferrer.total_points + QUEST_POINTS.referral + bonusAwarded,
          })
          .eq("id", validReferrer.id);

        if (bonusAwarded > 0) {
          await supabase.from("tasks").insert([
            {
              user_id: validReferrer.id,
              task_type: `refer_${referralCount}_bonus`,
              points_awarded: bonusAwarded,
            },
          ]);
        }
      }
    }

    // Get user rank
    const { count: rankCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("total_points", QUEST_POINTS.joinWaitlist);

    const rank = (rankCount ?? 0) + 1;

    return NextResponse.json(
      {
        referralCode,
        totalPoints: QUEST_POINTS.joinWaitlist,
        rank,
        referralTracked,
        referralCount,
        bonusAwarded,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Waitlist join error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
