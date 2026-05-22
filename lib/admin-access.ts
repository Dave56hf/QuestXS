export function isAllowedAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const configuredEmails =
    process.env.ADMIN_ALLOWED_EMAILS ?? process.env.ADMIN_EMAIL ?? "";
  const allowedEmails = configuredEmails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.length) {
    return true;
  }

  return allowedEmails.includes(email.toLowerCase());
}
