import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser, getSupabaseAdminClient } from "@/lib/supabase/server";
import { API_LIMITS } from "@/lib/config";

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
        .order("updated_at", { ascending: false })
        .limit(API_LIMITS.broadcastDrafts),
      supabase
        .from("broadcast_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(API_LIMITS.broadcastLogs),
    ]);

    if (draftsResult.error) {
      return NextResponse.json(
        { error: "Unable to load broadcasts." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      drafts: draftsResult.data ?? [],
      logs: logsResult.error ? [] : (logsResult.data ?? []),
      recipientCount: count ?? 0,
    });
  } catch (error) {
    console.error("Broadcast load error:", error);
    return NextResponse.json(
      { error: "Unable to load broadcasts." },
      { status: 500 },
    );
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
      return NextResponse.json(
        { error: "Unable to save draft." },
        { status: 500 },
      );
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    console.error("Broadcast save error:", error);
    return NextResponse.json(
      { error: "Unable to save draft." },
      { status: 500 },
    );
  }
}
