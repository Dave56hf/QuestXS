import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getCurrentAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "QuestXS Admin | Emails",
  description: "Prepare QuestXS waitlist broadcasts.",
};

export default async function AdminEmailsPage() {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/admin/signin");
  }

  return <AdminDashboard page="emails" />;
}
