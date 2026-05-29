import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getEmailEnv } from "@/lib/env";

type SendBroadcastEmailInput = {
  content: string;
  subject: string;
  to: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(content: string) {
  const escaped = escapeHtml(content);

  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" style="color:#22c55e;text-decoration:none;">$1</a>')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br />"))
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:#cbd5e1;font-size:16px;line-height:28px;">${paragraph}</p>`,
    )
    .join("");
}

export function renderBroadcastEmail({
  content,
  subject,
}: {
  content: string;
  subject: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#0a0a0a;color:#ffffff;font-family:Inter,Arial,sans-serif;">
      <div style="padding:40px 20px;">
        <div style="max-width:640px;margin:0 auto;border:1px solid #1f1f1f;background:#111111;border-radius:16px;overflow:hidden;">
          <div style="padding:32px 32px 20px;border-bottom:1px solid #1f1f1f;">
            <div style="display:inline-block;margin-bottom:18px;padding:6px 12px;border:1px solid rgba(34,197,94,0.2);border-radius:999px;background:rgba(34,197,94,0.1);color:#22c55e;font-size:12px;font-weight:600;">
              QuestXS Update
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:38px;font-weight:700;letter-spacing:-0.01em;">
              ${escapeHtml(subject)}
            </h1>
          </div>
          <div style="padding:32px;">
            ${renderMarkdown(content)}
            <div style="margin-top:32px;padding:22px;border:1px solid #1f1f1f;background:#0a0a0a;border-radius:12px;">
              <p style="margin:0;color:#ffffff;font-size:15px;line-height:24px;font-weight:700;">QuestXS</p>
              <p style="margin:6px 0 0;color:#6b7280;font-size:13px;line-height:22px;">
                AI-powered realtime crypto market intelligence.
              </p>
            </div>
          </div>
          <div style="padding:22px 32px;border-top:1px solid #1f1f1f;color:#6b7280;font-size:12px;line-height:20px;">
            You are receiving this because you joined the QuestXS waitlist.
          </div>
        </div>
      </div>
    </div>
  `;
}

function getFromAddress() {
  return getEmailEnv().broadcastFromEmail;
}

export async function sendBroadcastEmail({
  content,
  subject,
  to,
}: SendBroadcastEmailInput) {
  const from = getFromAddress();

  if (!from) {
    throw new Error("Broadcast sender email is not configured.");
  }

  const html = renderBroadcastEmail({ content, subject });

  const emailEnv = getEmailEnv();

  if (emailEnv.resendApiKey) {
    const resend = new Resend(emailEnv.resendApiKey);
    const { error } = await resend.emails.send({
      from,
      html,
      subject,
      to,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (!emailEnv.gmailUser || !emailEnv.gmailAppPassword) {
    throw new Error("Nodemailer credentials are not configured.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailEnv.gmailUser,
      pass: emailEnv.gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `QuestXS <${from}>`,
    html,
    subject,
    to,
  });
}
