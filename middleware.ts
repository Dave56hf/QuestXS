import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit, retryAfter } from "@/lib/rate-limit";

// Rate-limit rules: [pathname-prefix, max-requests, window-ms]
const RATE_LIMITS: Array<[string, number, number]> = [
  ["/api/admin/signin", 5, 60_000],     // 5 login attempts per minute (handled via form POST)
  ["/api/waitlist/join", 3, 60_000],    // 3 signups per minute per IP
  ["/api/tasks/complete", 10, 60_000],  // 10 task completions per minute per IP
];

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  // Rate limiting for login form actions (server action POST to /admin/signin)
  const isAdminSigninPost =
    (pathname === "/admin/signin" || pathname === "/admin/signin/") &&
    request.method === "POST";

  if (isAdminSigninPost) {
    const key = `signin:${ip}`;
    if (!rateLimit(key, 5, 60_000)) {
      return new NextResponse("Too many login attempts. Try again in a minute.", {
        status: 429,
        headers: { "Retry-After": String(retryAfter(key)), "Content-Type": "text/plain" },
      });
    }
  }

  // Rate limiting for public API routes
  for (const [prefix, max, windowMs] of RATE_LIMITS) {
    if (pathname.startsWith(prefix)) {
      const key = `${prefix}:${ip}`;
      if (!rateLimit(key, max, windowMs)) {
        return new NextResponse(JSON.stringify({ error: "Too many requests." }), {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter(key)),
            "Content-Type": "application/json",
          },
        });
      }
      break;
    }
  }

  const response = await updateSession(request);

  // Security headers on all responses
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/waitlist/:path*",
    "/api/tasks/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
