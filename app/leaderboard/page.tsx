import { redirect } from "next/navigation";
import LeaderboardClient from "./LeaderboardClient";

export default function LeaderboardPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  // code is optional; no redirect.
  const code = searchParams?.code;
  return <LeaderboardClient code={code} />;
}
