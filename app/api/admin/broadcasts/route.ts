import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser, getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentAdminUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const [{ count }, draftsResult, logsResult] = await Promise.all([
      supabase.from("waitlist").select("email", { count: "exact", head: true }),
      supabase
        .from("broadcast_drafts")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("broadcast_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(8),
    ]);

    if (draftsResult.error) {
      return NextResponse.json({ error: draftsResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      drafts: draftsResult.data ?? [],
      logs: logsResult.error ? [] : (logsResult.data ?? []),
      recipientCount: count ?? 0,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load broadcasts.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { content, subject } = (await request.json()) as {
      content?: string;
      subject?: string;
    };

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Subject and message are required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("broadcast_drafts")
      .insert({
        content: content.trim(),
        status: "draft",
        subject: subject.trim(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save draft.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
