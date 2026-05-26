import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser, getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
      .update({
        content: content.trim(),
        subject: subject.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .neq("status", "sent")
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update draft.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("broadcast_drafts")
      .delete()
      .eq("id", params.id)
      .neq("status", "sent");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete draft.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
