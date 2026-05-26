import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function maskEmail(email: string) {
  const parts = email.split("@");
  const local = parts[0] ?? "";
  const domain = parts[1] ?? "";
  const head = local.slice(0, 2);
  return `${head}${"***"}@${domain}`;
}

type Tier =
  | "LEGEND"
  | "ELITE"
  | "TOP 100"
  | "EARLY CONTRIBUTOR"
  | "CONTRIBUTOR";

function tierForRank(rank: number): { label: Tier } {
  if (rank <= 10) return { label: "LEGEND" };
  if (rank <= 50) return { label: "ELITE" };
  if (rank <= 100) return { label: "TOP 100" };
  if (rank <= 500) return { label: "EARLY CONTRIBUTOR" };
  return { label: "CONTRIBUTOR" };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = 100;
    const from = (page - 1) * pageSize;

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const { data, error } = await supabase
      .from("users")
      .select("id, email, referral_code, total_points")
      .order("total_points", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = data ?? [];

    const rows = users.map((u, index) => {
      // Global rank, not page-local
      const rank = from + index + 1;
      const tier = tierForRank(rank).label;

      const email = u.email as string | null;
      const display = email ? maskEmail(email) : (u.referral_code as string);

      return {
        rank,
        display,
        referral_code: u.referral_code,
        total_points: u.total_points,
        tier,
      };
    });

    return NextResponse.json({
      rows,
      page,
      pageSize,
      totalCount,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to load leaderboard." },
      { status: 500 },
    );
  }
}
