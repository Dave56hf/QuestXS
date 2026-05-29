import { NextRequest, NextResponse } from "next/server";
import { sendBroadcastEmail } from "@/lib/email/sendBroadcast";
import { getCurrentAdminUser, getSupabaseAdminClient } from "@/lib/supabase/server";
import { API_LIMITS } from "@/lib/config";

export const dynamic = "force-dynamic";

function uniqueEmails(rows: Array<{ email?: string | null }>) {
  return [
    ...new Set(
      rows
        .map((row) => row.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  ];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { content, draftId, subject, target = "all", testEmail } = (await request.json()) as {
      content?: string;
      draftId?: string;
      subject?: string;
      target?: "all" | "confirmed" | "pending" | "invited";
      testEmail?: string;
    };

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Subject and message are required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    if (testEmail) {
      await sendBroadcastEmail({
        content: content.trim(),
        subject: subject.trim(),
        to: testEmail,
      });

      return NextResponse.json({ failed: 0, sent: 1, test: true });
    }

    let activeDraftId = draftId;

    if (draftId) {
      const { data: draft, error } = await supabase
        .from("broadcast_drafts")
        .select("status")
        .eq("id", draftId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Unable to send broadcast." },
          { status: 500 },
        );
      }

      if (draft?.status === "sent") {
        return NextResponse.json(
          { error: "This broadcast has already been sent." },
          { status: 409 },
        );
      }
    } else {
      const { data: draft, error } = await supabase
        .from("broadcast_drafts")
        .insert({
          content: content.trim(),
          status: "draft",
          subject: subject.trim(),
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Unable to send broadcast." },
          { status: 500 },
        );
      }

      activeDraftId = draft.id;
    }

    const { data: users, error: usersError } = await supabase
      .from("waitlist")
      .select("email, status")
      .limit(API_LIMITS.broadcastRecipients);

    if (usersError) {
      return NextResponse.json(
        { error: "Unable to send broadcast." },
        { status: 500 },
      );
    }

    const targetedUsers =
      target === "all"
        ? (users ?? [])
        : (users ?? []).filter((row) => {
            const status =
              typeof row.status === "string" ? row.status.toLowerCase() : "confirmed";
            return status === target;
          });
    const recipients = uniqueEmails(targetedUsers);
    let sent = 0;
    let failed = 0;

    for (
      let index = 0;
      index < recipients.length;
      index += API_LIMITS.broadcastBatchSize
    ) {
      const batch = recipients.slice(
        index,
        index + API_LIMITS.broadcastBatchSize,
      );
      const results = await Promise.allSettled(
        batch.map((to) =>
          sendBroadcastEmail({
            content: content.trim(),
            subject: subject.trim(),
            to,
          }),
        ),
      );

      sent += results.filter((result) => result.status === "fulfilled").length;
      failed += results.filter((result) => result.status === "rejected").length;
    }

    await supabase
      .from("broadcast_drafts")
      .update({
        content: content.trim(),
        sent_at: new Date().toISOString(),
        status: "sent",
        subject: subject.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeDraftId);

    await supabase.from("broadcast_logs").insert({
      draft_id: activeDraftId,
      initiated_by: user.email,
      total_failed: failed,
      total_sent: sent,
    });

    return NextResponse.json({
      draftId: activeDraftId,
      failed,
      sent,
      total: recipients.length,
    });
  } catch (error) {
    console.error("Broadcast send error:", error);
    return NextResponse.json(
      { error: "Unable to send broadcast." },
      { status: 500 },
    );
  }
}
