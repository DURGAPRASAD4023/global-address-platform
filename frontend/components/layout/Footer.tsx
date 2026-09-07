"use client";

import Link from "next/link";
import { Mail, Heart } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-200/80 bg-[#edf3f3]/90 text-ink-600">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Logo size={28} showText={false} />
            <div>
              <p className="text-sm font-bold text-ink-950">Global Address Platform</p>
              <p className="text-xs text-ink-500">60+ countries · OpenStreetMap · ISO 19160</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center gap-4 text-xs text-ink-500">
            {[
              { href: "/", label: "Dashboard" },
              { href: "/generate", label: "Generate" },
              { href: "/validate", label: "Validate" },
              { href: "/lab", label: "Lab" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-teal-800 transition">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Creator */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <p className="font-semibold text-ink-900">Yadlapalli Durga Prasad</p>
              <p className="text-ink-500">Software Engineer</p>
            </div>
            <a
              href="mailto:durgaprasadee059@gmail.com"
              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-xs font-medium text-teal-800 shadow-xs transition hover:bg-teal-50"
            >
              <Mail className="h-3.5 w-3.5" />
              Mail
            </a>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 pt-4 text-[11px] text-ink-400">
          <p>
            © {currentYear} Global Address Platform · Built by{" "}
            <span className="font-semibold text-ink-600">Yadlapalli Durga Prasad</span> · All rights reserved.
          </p>
          <span className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 fill-red-400 text-red-400" /> for global developers
          </span>
        </div>
      </div>
    </footer>
  );
}
