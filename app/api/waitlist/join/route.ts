import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function randCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const suffix = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `QUEST-${suffix}`;
}

type Body = {
  email?: string;
  name?: string;
  role?: string;
  referredBy?: string | null;
};

function maskEmail(email: string) {
  const parts = email.split("@");
  const local = parts[0] ?? "";
  const domain = parts[1] ?? "";
  const head = local.slice(0, 2);
  return `${head}${"***"}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, referredBy } = (await req.json()) as Body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    // NOTE: honor system flow; email validation is intentionally left to the existing waitlist form.

    const supabase = getSupabaseAdminClient();

    // If the user already exists, don't double insert.
    const existing = await supabase
      .from("users")
      .select("id, email, referral_code, total_points")
      .eq("email", email)
      .maybeSingle();
    if (existing.error) {
      return NextResponse.json(
        { error: existing.error.message },
        { status: 500 },
      );
    }

    if (existing.data) {
      const user = existing.data;

      // If they already have a referral record, don't add another.
      if (referredBy && referredBy.trim()) {
        const { data: referrerUser } = await supabase
          .from("users")
          .select("id")
          .eq("referral_code", referredBy)
          .maybeSingle();

        if (referrerUser) {
          const already = await supabase
            .from("referrals")
            .select("id")
            .eq("referrer_code", referredBy)
            .eq("referee_email", email)
            .maybeSingle();

          if (!already.data) {
            const { data: insertReferral, error: insertReferralError } =
              await supabase
                .from("referrals")
                .insert([
                  {
                    referrer_code: referredBy,
                    referee_email: email,
                    points_awarded: 250,
                  },
                ])
                .select("id")
                .maybeSingle();

            if (insertReferralError) {
              return NextResponse.json(
                { error: insertReferralError.message },
                { status: 500 },
              );
            }

            // Proper update: add points_awarded

            const { data: referrerAfter, error: referrerAfterError } =
              await supabase
                .from("users")
                .select("total_points")
                .eq("id", referrerUser.id)
                .maybeSingle();

            if (referrerAfterError) {
              return NextResponse.json(
                { error: referrerAfterError.message },
                { status: 500 },
              );
            }

            const currentPoints = referrerAfter?.total_points ?? 0;
            const updatedPoints = currentPoints + 250;

            const { error: updateReferrerError2 } = await supabase
              .from("users")
              .update({ total_points: updatedPoints })
              .eq("id", referrerUser.id);

            if (updateReferrerError2) {
              return NextResponse.json(
                { error: updateReferrerError2.message },
                { status: 500 },
              );
            }

            // Count referrals for bonus thresholds.
            const { data: referralRows, error: referralCountError } =
              await supabase
                .from("referrals")
                .select("id")
                .eq("referrer_code", referredBy);

            if (referralCountError) {
              return NextResponse.json(
                { error: referralCountError.message },
                { status: 500 },
              );
            }

            const totalRefs = (referralRows ?? []).length;
            let bonus = 0;
            if (totalRefs === 5) bonus = 500;
            if (totalRefs === 10) bonus = 1500;

            if (bonus > 0) {
              const { error: bonusError } = await supabase
                .from("tasks")
                .insert([
                  {
                    user_id: referrerUser.id,
                    task_type: totalRefs === 5 ? "referral_5" : "referral_10",
                    points_awarded: bonus,
                  },
                ]);

              if (bonusError) {
                // If tasks already exist, let it be idempotent
                // and avoid failing user join.
                // TODO: make this fully idempotent using unique constraints.
                void bonusError;
              }

              // Update referrer points.
              const { data: referrerAfter2, error: referrerAfterError2 } =
                await supabase
                  .from("users")
                  .select("total_points")
                  .eq("id", referrerUser.id)
                  .maybeSingle();

              if (referrerAfterError2) {
                return NextResponse.json(
                  { error: referrerAfterError2.message },
                  { status: 500 },
                );
              }

              const updatedPoints2 =
                (referrerAfter2?.total_points ?? 0) + bonus;
              const { error: updateReferrerError3 } = await supabase
                .from("users")
                .update({ total_points: updatedPoints2 })
                .eq("id", referrerUser.id);

              if (updateReferrerError3) {
                return NextResponse.json(
                  { error: updateReferrerError3.message },
                  { status: 500 },
                );
              }
            }
          }
        }
      }

      // Rank
      const { data: higher, error: higherError } = await supabase
        .from("users")
        .select("id")
        .gt("total_points", user.total_points);

      if (higherError) {
        return NextResponse.json(
          { error: higherError.message },
          { status: 500 },
        );
      }

      const rank = (higher?.length ?? 0) + 1;

      return NextResponse.json({
        referralCode: user.referral_code,
        totalPoints: user.total_points,
        rank,
      });
    }

    // Create a new user
    let referralCode = randCode();

    // Ensure uniqueness (loop a few times)
    for (let i = 0; i < 5; i++) {
      const check = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (!check.data) break;
      referralCode = randCode();
    }

    const referredByCode =
      referredBy && referredBy.trim() ? referredBy.trim() : null;

    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email,
          referral_code: referralCode,
          referred_by: referredByCode,
          total_points: 100,
        },
      ])
      .select("id, referral_code, total_points")
      .maybeSingle();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (!inserted) {
      return NextResponse.json(
        { error: "Unable to create user." },
        { status: 500 },
      );
    }

    // Handle referrer points
    if (referredByCode) {
      const { data: referrerUser, error: referrerUserError } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referredByCode)
        .maybeSingle();

      if (referrerUserError) {
        return NextResponse.json(
          { error: referrerUserError.message },
          { status: 500 },
        );
      }

      if (referrerUser) {
        const { error: refInsertError } = await supabase
          .from("referrals")
          .insert([
            {
              referrer_code: referredByCode,
              referee_email: email,
              points_awarded: 250,
            },
          ]);

        if (refInsertError) {
          // If referral already exists, ignore to keep idempotent.
          // TODO: add unique constraint (referrer_code, referee_email).
          void refInsertError;
        }

        // Update referrer total_points (+250)
        const { data: referrerAfter, error: referrerAfterError } =
          await supabase
            .from("users")
            .select("total_points")
            .eq("id", referrerUser.id)
            .maybeSingle();

        if (referrerAfterError) {
          return NextResponse.json(
            { error: referrerAfterError.message },
            { status: 500 },
          );
        }

        const updatedPoints = (referrerAfter?.total_points ?? 0) + 250;

        const { error: updateReferrerError } = await supabase
          .from("users")
          .update({ total_points: updatedPoints })
          .eq("id", referrerUser.id);

        if (updateReferrerError) {
          return NextResponse.json(
            { error: updateReferrerError.message },
            { status: 500 },
          );
        }

        // Count referrals for bonus thresholds.
        const { data: referralRows, error: referralCountError } = await supabase
          .from("referrals")
          .select("id")
          .eq("referrer_code", referredByCode);

        if (referralCountError) {
          return NextResponse.json(
            { error: referralCountError.message },
            { status: 500 },
          );
        }

        const totalRefs = (referralRows ?? []).length;
        if (totalRefs === 5 || totalRefs === 10) {
          const taskType = totalRefs === 5 ? "referral_5" : "referral_10";
          const bonus = totalRefs === 5 ? 500 : 1500;

          // Insert task to be idempotent-ish
          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("user_id", referrerUser.id)
            .eq("task_type", taskType)
            .maybeSingle();

          if (!existingTask) {
            const { error: insertBonusTaskError } = await supabase
              .from("tasks")
              .insert([
                {
                  user_id: referrerUser.id,
                  task_type: taskType,
                  points_awarded: bonus,
                },
              ]);

            if (insertBonusTaskError) {
              // ignore (race)
              void insertBonusTaskError;
            }

            // add bonus points
            const { data: referrerAfter2, error: referrerAfterError2 } =
              await supabase
                .from("users")
                .select("total_points")
                .eq("id", referrerUser.id)
                .maybeSingle();

            if (referrerAfterError2) {
              return NextResponse.json(
                { error: referrerAfterError2.message },
                { status: 500 },
              );
            }

            const updatedPoints2 = (referrerAfter2?.total_points ?? 0) + bonus;

            const { error: updateReferrerError2 } = await supabase
              .from("users")
              .update({ total_points: updatedPoints2 })
              .eq("id", referrerUser.id);

            if (updateReferrerError2) {
              return NextResponse.json(
                { error: updateReferrerError2.message },
                { status: 500 },
              );
            }
          }
        }
      }
    }

    // Rank for the new user
    const { data: higher, error: higherError } = await supabase
      .from("users")
      .select("id")
      .gt("total_points", inserted.total_points);

    if (higherError) {
      return NextResponse.json({ error: higherError.message }, { status: 500 });
    }

    const rank = (higher?.length ?? 0) + 1;

    return NextResponse.json({
      referralCode: inserted.referral_code,
      totalPoints: inserted.total_points,
      rank,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to join waitlist." },
      { status: 500 },
    );
  }
}
