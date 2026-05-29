import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { getSupabasePublicEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  let supabaseEnv: ReturnType<typeof getSupabasePublicEnv>;
  try {
    supabaseEnv = getSupabasePublicEnv();
  } catch {
    return response;
  }

  const supabase = createServerClient(supabaseEnv.supabaseUrl, supabaseEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isSignInPage = pathname === "/admin/signin";
  const isProtectedAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/");
  const isAuthenticatedAdmin = user && isAllowedAdminEmail(user.email);

  if (isSignInPage && isAuthenticatedAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isProtectedAdminRoute && !isSignInPage && !isAuthenticatedAdmin) {
    const redirectUrl = new URL("/admin/signin", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
