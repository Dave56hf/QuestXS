import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSignIn from "@/components/admin/AdminSignIn";
import { getCurrentAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QuestXS Admin Sign In",
  description: "Sign in to the QuestXS admin dashboard.",
};

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string };
}) {
  const user = await getCurrentAdminUser();

  if (user) {
    redirect("/admin");
  }

  const redirectTo = searchParams?.redirectTo?.startsWith("/admin")
    ? searchParams.redirectTo
    : "/admin";

  return <AdminSignIn redirectTo={redirectTo} />;
}
