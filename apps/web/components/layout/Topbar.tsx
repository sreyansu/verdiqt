"use client";

import { Scale, Bell, Menu, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Play,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/disputes", label: "Disputes", icon: Scale },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/demo", label: "Demo", icon: Play },
];

export default function Topbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border px-4 lg:px-6 py-3 print:hidden">
      <div className="flex items-center justify-between">
        {/* Mobile menu */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger className="lg:hidden p-2 rounded-lg hover:bg-bg-elevated transition-colors">
              <Menu className="w-5 h-5 text-text-secondary" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-white border-border w-72 p-0">
              <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl gradient-text">Verdiqt</span>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-accent-primary/10 text-accent-primary font-medium"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent-primary" />
            <span className="font-display font-semibold gradient-text">Verdiqt</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-bg-elevated transition-colors relative">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-danger rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
