"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Database, History, Search, LayoutDashboard, Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze", icon: Search },
  { href: "/icp", label: "ICP Knowledge Base", icon: Database },
  { href: "/icp/history", label: "ICP History", icon: History },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-tga-teal-700 shadow-lg shadow-tga-teal-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
            <div className="bg-white rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 shadow-sm shrink-0">
              <Image
                src="/tga-logo.png"
                alt="The Global Associates"
                width={180}
                height={48}
                className="h-7 sm:h-10 w-auto"
                priority
              />
            </div>
            <span className="hidden lg:block text-white/40 text-sm font-medium border-l border-white/20 pl-3">
              ICP Analyzer
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-tga-orange-500 text-white shadow-md shadow-tga-orange-900/30"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden">{label.split(" ")[0]}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-white/10 bg-tga-teal-800 px-4 py-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-tga-orange-500 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="h-1 bg-gradient-to-r from-tga-orange-400 via-tga-orange-500 to-tga-orange-400" />
    </header>
  );
}
