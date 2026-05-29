import { getAdminAccessEnv } from "@/lib/env";

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const { allowedEmails: configuredEmails } = getAdminAccessEnv();
  const allowedEmails = configuredEmails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.length) {
    return true;
  }

  return allowedEmails.includes(email.toLowerCase());
}
