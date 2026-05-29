import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { getSupabaseAdminEnv, getSupabasePublicEnv } from "@/lib/env";

export function createSupabaseServerClient() {
  const { supabaseAnonKey, supabaseUrl } = getSupabasePublicEnv();

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

export function getSupabaseClient() {
  const { supabaseAnonKey, supabaseUrl } = getSupabasePublicEnv();

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseAdminClient() {
  const { supabaseServiceRoleKey, supabaseUrl } = getSupabaseAdminEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentAdminUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdminEmail(user.email)) {
    return null;
  }

  return user;
}
