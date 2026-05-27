import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center md:flex-row">
        <Link href="/" className="font-display text-lg font-bold">
          QUEST
        </Link>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} Quest. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted">
          <a href="#" className="transition hover:text-white">
            Privacy Policy
          </a>
          <a href="#" className="transition hover:text-white">
            Terms of Use
          </a>
          <a aria-label="X" href="#" className="transition hover:text-accent">
            <Send size={20} className="cursor-pointer" />
          </a>
          <a
            aria-label="Discord"
            href="#"
            className="transition hover:text-accent"
          >
            <MessageCircle size={20} className="cursor-pointer" />
          </a>
        </div>
      </div>
    </footer>
  );
}
