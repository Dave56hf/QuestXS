import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getCurrentAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QuestXS Admin | Settings",
  description: "Configure QuestXS admin integrations and security.",
};

export default async function AdminSettingsPage() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/signin");
  }

  return <AdminDashboard page="settings" />;
}
