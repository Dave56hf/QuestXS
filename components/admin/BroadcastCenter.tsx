"use client";

import {
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Mail,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Badge from "@/components/ui/Badge";

type BroadcastDraft = {
  content: string;
  created_at: string;
  id: string;
  sent_at: string | null;
  status: "draft" | "scheduled" | "sent";
  subject: string;
  updated_at: string;
};

type BroadcastLog = {
  draft_id: string | null;
  id: string;
  initiated_by: string | null;
  sent_at: string;
  total_failed: number;
  total_sent: number;
};

type BroadcastResponse = {
  drafts: BroadcastDraft[];
  logs: BroadcastLog[];
  recipientCount: number;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to load broadcasts.");
  }

  return payload;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "Not sent";
  }

  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function markdownPreview(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .slice(0, 140);
}

function StatusBadge({ status }: { status: BroadcastDraft["status"] }) {
  const active = status === "sent";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-accent/20 bg-accent/10 text-accent"
          : "border-border bg-bg text-muted"
      }`}
    >
      {status}
    </span>
  );
}

export default function BroadcastCenter({
  fallbackRecipientCount,
}: {
  fallbackRecipientCount: number;
}) {
  const { data, error, isLoading, mutate } = useSWR<BroadcastResponse>(
    "/api/admin/broadcasts",
    fetcher,
  );
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autosaveState, setAutosaveState] = useState("Idle");
  const recipientCount = data?.recipientCount ?? fallbackRecipientCount;
  const drafts = useMemo(() => data?.drafts ?? [], [data?.drafts]);
  const logs = useMemo(() => data?.logs ?? [], [data?.logs]);
  const activeDraft = useMemo(
    () => drafts.find((draft) => draft.id === activeDraftId),
    [activeDraftId, drafts],
  );

  useEffect(() => {
    if (!activeDraftId || !subject.trim() || !content.trim()) {
      return;
    }

    setAutosaveState("Unsaved changes");
    const timeout = window.setTimeout(() => {
      void saveDraft(true);
    }, 1800);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, content, activeDraftId]);

  function resetMessages() {
    setNotice("");
    setErrorMessage("");
  }

  function loadDraft(draft: BroadcastDraft) {
    setActiveDraftId(draft.id);
    setSubject(draft.subject);
    setContent(draft.content);
    setAutosaveState("Loaded");
    resetMessages();
  }

  function newDraft() {
    setActiveDraftId(null);
    setSubject("");
    setContent("");
    setAutosaveState("Idle");
    resetMessages();
  }

  async function saveDraft(isAutoSave = false) {
    resetMessages();

    if (!subject.trim() || !content.trim()) {
      if (!isAutoSave) {
        setErrorMessage("Subject and message are required before saving.");
      }
      return;
    }

    setSaving(true);
    setAutosaveState(isAutoSave ? "Autosaving..." : "Saving...");

    try {
      const response = await fetch(
        activeDraftId ? `/api/admin/broadcasts/${activeDraftId}` : "/api/admin/broadcasts",
        {
          method: activeDraftId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, subject }),
        },
      );
      const payload = (await response.json()) as {
        draft?: BroadcastDraft;
        error?: string;
      };

      if (!response.ok || !payload.draft) {
        setErrorMessage(payload.error ?? "Unable to save draft.");
        setAutosaveState("Save failed");
        return;
      }

      setActiveDraftId(payload.draft.id);
      setAutosaveState("Saved");
      if (!isAutoSave) {
        setNotice("Draft saved.");
      }
      await mutate();
    } catch {
      setErrorMessage("Unable to save draft.");
      setAutosaveState("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendBroadcast(testEmail?: string) {
    resetMessages();

    if (!subject.trim() || !content.trim()) {
      setErrorMessage("Subject and message are required before sending.");
      return;
    }

    if (testEmail) {
      setTesting(true);
    } else {
      setSending(true);
    }

    try {
      const response = await fetch("/api/admin/broadcasts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          draftId: activeDraftId,
          subject,
          target,
          testEmail,
        }),
      });
      const payload = (await response.json()) as {
        draftId?: string;
        error?: string;
        failed?: number;
        sent?: number;
        total?: number;
      };

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Unable to send broadcast.");
        return;
      }

      if (testEmail) {
        setNotice("Test email sent.");
      } else {
        setNotice(
          `Broadcast sent successfully. ${payload.sent ?? 0} sent, ${payload.failed ?? 0} failed.`,
        );
        setConfirmOpen(false);
        setActiveDraftId(payload.draftId ?? activeDraftId);
      }

      await mutate();
    } catch {
      setErrorMessage("Unable to send broadcast.");
    } finally {
      setSending(false);
      setTesting(false);
    }
  }

  async function deleteDraft(id: string) {
    resetMessages();
    const response = await fetch(`/api/admin/broadcasts/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "Unable to delete draft.");
      return;
    }

    if (activeDraftId === id) {
      newDraft();
    }

    setNotice("Draft deleted.");
    await mutate();
  }

  return (
    <div className="space-y-6">
      {(notice || errorMessage || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            errorMessage || error
              ? "border-danger/20 bg-danger/10 text-danger"
              : "border-accent/20 bg-accent/10 text-accent"
          }`}
        >
          {errorMessage || error?.message || notice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-accent" />
              <div>
                <h2 className="font-display text-xl font-semibold">Broadcast Composer</h2>
                <p className="mt-1 text-sm text-muted">
                  Compose updates, beta invitations, and launch announcements.
                </p>
              </div>
            </div>
            <Badge>{autosaveState}</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <input
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white placeholder-muted outline-none transition focus:border-accent"
              placeholder="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Recipients
              </span>
              <select
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              >
                <option value="all">All waitlist users</option>
                <option value="confirmed">Confirmed users</option>
                <option value="pending">Pending users</option>
                <option value="invited">Invited users</option>
              </select>
            </label>
            <textarea
              className="min-h-56 w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm leading-6 text-white placeholder-muted outline-none transition focus:border-accent"
              placeholder="Write the announcement. Markdown supported: **bold**, [links](https://example.com), line breaks."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />

            <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 md:flex-row md:items-center">
              <div className="text-sm text-muted">
                Estimated recipients:{" "}
                <span className="font-semibold text-white">{recipientCount.toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center rounded-lg border border-border bg-bg px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/30 disabled:opacity-50"
                  disabled={!subject || !content}
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </button>
                <button
                  className="inline-flex items-center rounded-lg border border-border bg-bg px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/30 disabled:opacity-50"
                  disabled={saving}
                  onClick={() => {
                    void saveDraft();
                  }}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                  Save Draft
                </button>
                <button
                  className="inline-flex items-center rounded-lg border border-border bg-bg px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/30 disabled:opacity-50"
                  disabled={testing || !subject || !content}
                  onClick={() => {
                    const email = window.prompt("Send test to which email?");
                    if (email) {
                      void sendBroadcast(email);
                    }
                  }}
                >
                  {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Test
                </button>
                <button
                  className="inline-flex items-center rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-50"
                  disabled={sending || !subject || !content || activeDraft?.status === "sent"}
                  onClick={() => setConfirmOpen(true)}
                >
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Broadcast
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-xl font-semibold">Broadcast Operations</h2>
          <div className="mt-5 divide-y divide-border text-sm">
            {[
              ["Audience", `${recipientCount.toLocaleString()} waitlist users`],
              ["Targeting", target === "all" ? "All waitlist users" : `${target} users`],
              ["Active draft", activeDraft?.subject ?? "Unsaved composer"],
              ["Delivery", "Batched sending"],
              ["Scheduling", "Placeholder ready"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-4">
                <span className="text-muted">{label}</span>
                <span className="text-right font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-bg p-4">
            <p className="text-sm font-medium">Recent send logs</p>
            <div className="mt-3 space-y-3">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{formatDate(log.sent_at)}</span>
                    <span className="text-accent">
                      {log.total_sent} sent / {log.total_failed} failed
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">No broadcasts sent yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-semibold">Saved Broadcast Drafts</h2>
            <p className="mt-1 text-sm text-muted">
              Reopen, edit, send, or remove unfinished announcements.
            </p>
          </div>
          <button
            className="rounded-lg border border-border bg-bg px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/30"
            onClick={newDraft}
          >
            New Broadcast
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <p className="rounded-lg border border-border bg-bg px-4 py-6 text-sm text-muted">
              Loading drafts...
            </p>
          ) : drafts.length ? (
            drafts.map((draft) => (
              <article
                key={draft.id}
                className="rounded-lg border border-border bg-bg p-4 transition hover:border-accent/30"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-semibold">{draft.subject}</h3>
                      <StatusBadge status={draft.status} />
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                      {markdownPreview(draft.content) || "No message body yet."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                      <span>Created {formatDate(draft.created_at)}</span>
                      <span>Edited {formatDate(draft.updated_at)}</span>
                      {draft.sent_at && <span>Sent {formatDate(draft.sent_at)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:text-white"
                      onClick={() => loadDraft(draft)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:text-white disabled:opacity-40"
                      disabled={draft.status === "sent"}
                      onClick={() => {
                        loadDraft(draft);
                        setConfirmOpen(true);
                      }}
                    >
                      Send
                    </button>
                    <button
                      className="rounded-lg border border-danger/20 px-3 py-2 text-xs text-danger transition hover:bg-danger/10 disabled:opacity-40"
                      disabled={draft.status === "sent"}
                      onClick={() => {
                        void deleteDraft(draft.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-border bg-bg px-4 py-8 text-center text-sm text-muted">
              No saved drafts yet.
            </p>
          )}
        </div>
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold">Send broadcast?</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Are you sure you want to send this broadcast to{" "}
                  <span className="text-white">{recipientCount.toLocaleString()}</span> waitlist users?
                </p>
              </div>
              <button
                aria-label="Close confirmation"
                className="rounded-lg border border-border p-2 text-muted transition hover:text-white"
                onClick={() => setConfirmOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-lg border border-border px-4 py-3 text-sm font-semibold text-white transition hover:border-accent/30"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/15 disabled:opacity-50"
                disabled={sending}
                onClick={() => {
                  void sendBroadcast();
                }}
              >
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold">Email preview</h3>
                <p className="mt-1 text-sm text-muted">{subject || "Untitled broadcast"}</p>
              </div>
              <button
                aria-label="Close preview"
                className="rounded-lg border border-border p-2 text-muted transition hover:text-white"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 rounded-lg border border-border bg-bg p-5">
              <Badge>QuestXS Update</Badge>
              <h4 className="mt-5 font-display text-2xl font-semibold">{subject}</h4>
              <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted">
                {content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
