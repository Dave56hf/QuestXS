import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getCurrentAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QuestXS Admin | Traffic",
  description: "Analyze QuestXS traffic sources and campaigns.",
};

export default async function AdminTrafficPage() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/signin");
  }

  return <AdminDashboard page="traffic" />;
}
