import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessEnv, getSupabaseAdminEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/setup
// Header: Authorization: Bearer <SUPABASE_SECRET_KEY>
// Body: { "password": "your-admin-password" }
//
// Creates a Supabase Auth user for each email in ADMIN_ALLOWED_EMAILS.
// Safe to call multiple times — skips emails that already have an account.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let adminEnv: ReturnType<typeof getSupabaseAdminEnv>;
  try {
    adminEnv = getSupabaseAdminEnv();
  } catch {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }

  if (!token || token !== adminEnv.supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const password =
    body && typeof body === "object" && "password" in body ? String((body as Record<string, unknown>).password) : "";

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "A password of at least 8 characters is required." },
      { status: 400 },
    );
  }

  const { allowedEmails } = getAdminAccessEnv();
  const emails = allowedEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!emails.length) {
    return NextResponse.json(
      { error: "ADMIN_ALLOWED_EMAILS is not configured." },
      { status: 503 },
    );
  }

  const supabase = createClient(adminEnv.supabaseUrl, adminEnv.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: Array<{ email: string; status: "created" | "exists" | "error"; detail?: string }> = [];

  for (const email of emails) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some((u) => u.email?.toLowerCase() === email);

    if (alreadyExists) {
      results.push({ email, status: "exists" });
      continue;
    }

    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      results.push({ email, status: "error", detail: error.message });
    } else {
      results.push({ email, status: "created" });
    }
  }

  return NextResponse.json({ results });
}
