import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getCurrentAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QuestXS Admin | Engagement",
  description: "Monitor QuestXS engagement behavior.",
};

export default async function AdminEngagementPage() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/signin");
  }

  return <AdminDashboard page="engagement" />;
}
