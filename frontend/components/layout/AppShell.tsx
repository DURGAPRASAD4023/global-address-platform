"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Footer } from "@/components/layout/Footer";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/lab", label: "Address Lab" },
  { href: "/tests", label: "Testing" },
  { href: "/generate", label: "Generate" },
  { href: "/validate", label: "Validate" },
  { href: "/history", label: "History" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f9]">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-[#eef3f3]/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-2.5">
          <Link href="/" className="transition hover:opacity-90">
            <Logo size={36} />
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Primary">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white font-semibold text-teal-900 shadow-sm ring-1 ring-ink-200/60"
                      : "text-ink-600 hover:bg-white/70 hover:text-ink-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
