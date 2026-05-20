import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SupabaseAnalytics from "@/components/analytics/SupabaseAnalytics";
import SiteChrome from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Quest | Crypto Market Intelligence",
  description:
    "Quest scans the crypto market 24/7 to surface trending coins, momentum shifts, and market opportunities early.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-white antialiased">
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
        <SupabaseAnalytics />
      </body>
    </html>
  );
}
