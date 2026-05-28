import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "questxs_anon_id";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback (non-cryptographic), still sufficient for anonymous identity.
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getAnonIdFromRequest(request: NextRequest): string | null {
  const value = request.cookies.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return value;
}

export function ensureAnonIdInResponse(
  request: NextRequest,
  response: NextResponse,
): string {
  const existing = getAnonIdFromRequest(request);
  if (existing) return existing;

  const id = createId();
  response.cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 180 days: long enough for “return later” but not permanent.
    maxAge: 60 * 60 * 24 * 180,
  });

  return id;
}

export { COOKIE_NAME as QUESTXS_ANON_ID_COOKIE };
