import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getCurrentAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QuestXS Admin | Analytics",
  description: "Track QuestXS growth analytics.",
};

export default async function AdminAnalyticsPage() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/signin");
  }

  return <AdminDashboard page="analytics" />;
}
