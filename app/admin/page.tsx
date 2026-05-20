import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "QuestXS Admin | Growth Control Center",
  description:
    "Operational dashboard for QuestXS waitlist growth, analytics, traffic sources, and platform health.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
