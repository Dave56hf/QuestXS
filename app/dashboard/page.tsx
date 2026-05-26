import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams?.code;
  if (!code) redirect("/waitlist");
  return <DashboardClient code={code} />;
}
