type EnvKey =
  | "ADMIN_ALLOWED_EMAILS"
  | "ADMIN_EMAIL"
  | "BROADCAST_FROM_EMAIL"
  | "GMAIL_APP_PASSWORD"
  | "GMAIL_USER"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NODE_ENV"
  | "RESEND_API_KEY"
  | "SUPABASE_SECRET_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

function readEnv(key: EnvKey): string | undefined {
  return process.env[key];
}

function requireEnv(key: EnvKey): string {
  const value = readEnv(key);

  if (!value) {
    throw new Error(`${key} is not configured.`);
  }

  return value;
}

export function getSupabasePublicEnv() {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseAdminEnv() {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey:
      readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? requireEnv("SUPABASE_SECRET_KEY"),
  };
}

export function getAdminAccessEnv() {
  return {
    allowedEmails: readEnv("ADMIN_ALLOWED_EMAILS") ?? readEnv("ADMIN_EMAIL") ?? "",
  };
}

export function getEmailEnv() {
  return {
    broadcastFromEmail:
      readEnv("BROADCAST_FROM_EMAIL") ?? readEnv("GMAIL_USER") ?? "",
    gmailAppPassword: readEnv("GMAIL_APP_PASSWORD") ?? "",
    gmailUser: readEnv("GMAIL_USER") ?? "",
    resendApiKey: readEnv("RESEND_API_KEY") ?? "",
  };
}

export function isProductionEnv() {
  return readEnv("NODE_ENV") === "production";
}
