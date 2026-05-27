import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";
import SupabaseAnalytics from "@/components/analytics/SupabaseAnalytics";
import SiteChrome from "@/components/layout/SiteChrome";
import { WalletProviders } from "@/app/providers";

export const metadata: Metadata = {
  title: "Quest | Crypto Market Intelligence",
  description:
    "Quest scans the crypto market 24/7 to surface trending coins, momentum shifts, and market opportunities early.",

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-white antialiased">
        <WalletProviders>
          <Suspense fallback={<main />}>
            <SiteChrome>{children}</SiteChrome>
          </Suspense>
        </WalletProviders>
        <Analytics />
        <Suspense fallback={null}>
          <SupabaseAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
