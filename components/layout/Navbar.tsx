"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";

const links = [
  ["Features", "#features"],
  ["How It Works", "#how-it-works"],
  ["Benefits", "#benefits"],
  ["Roadmap", "#roadmap"],
  ["FAQ", "#faq"],
];

export default function Navbar() {
  const pathname = usePathname();
  const isWaitlist = pathname === "/waitlist";

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="font-display text-xl font-bold tracking-wide">
          QUEST
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {isWaitlist ? (
            <Link href="/" className="text-sm text-muted transition hover:text-white">
              Back to Home
            </Link>
          ) : (
            links.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-muted transition hover:text-white"
              >
                {label}
              </a>
            ))
          )}
        </div>

        <Button href="/waitlist" variant="outline" size="sm">
          Join Waitlist
        </Button>
      </nav>
    </header>
  );
}
