"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import DashboardNavbar from "@/components/layout/DashboardNavbar";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <main>{children}</main>;
  }

  const isDashboardArea =
    pathname.startsWith("/dashboard") || pathname.startsWith("/leaderboard");

  return (
    <>
      {isDashboardArea ? <DashboardNavbar /> : <Navbar />}
      <main>{children}</main>
      <Footer />
    </>
  );
}
