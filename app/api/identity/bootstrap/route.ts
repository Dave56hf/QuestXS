import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { ensureAnonIdInResponse } from "@/lib/identity/anon-cookie";

function normalizeReferralCode(code?: string | null): string | null {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return null;
  return normalized;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();

  try {
    const body = (await req.json()) as {
      referralCode?: string;
      code?: string;
    };

    const referralCode = normalizeReferralCode(body.referralCode ?? body.code);
    if (!referralCode) {
      return NextResponse.json(
        { error: "referralCode is required" },
        { status: 400 },
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: "Unable to bootstrap session." },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure cookie exists.
    const response = new NextResponse();
    const anonId = ensureAnonIdInResponse(req, response);

    // Upsert mapping.
    // Assumes anon_identities has a unique/primary key on anon_id.
    const { error: upsertError } = await supabase
      .from("anon_identities")
      .upsert({ anon_id: anonId, user_id: user.id }, { onConflict: "anon_id" });

    if (upsertError) {
      return NextResponse.json(
        { error: "Unable to bootstrap session." },
        { status: 500 },
      );
    }

    // Re-fetch for convenience.
    response.headers.set("x-questxs-anon-id", anonId);
    return NextResponse.json(
      { success: true },
      { status: 200, headers: response.headers },
    );
  } catch (err) {
    console.error("Identity bootstrap error:", err);
    return NextResponse.json(
      { error: "Unable to bootstrap session." },
      { status: 500 },
    );
  }
}
