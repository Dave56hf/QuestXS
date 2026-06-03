"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAdmin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const redirectTo = (formData.get("redirectTo") as string | null) ?? "/admin";
  const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { error: "Invalid email or password." };
  }

  if (!isAllowedAdminEmail(email)) {
    await supabase.auth.signOut();
    return { error: "This account is not authorized for admin access." };
  }

  revalidatePath("/admin", "layout");
  redirect(safeRedirect);
}
