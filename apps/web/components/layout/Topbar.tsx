"use client";

import { Scale, Menu, User, LogOut, Shield, Users, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Wallet,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useAuth } from "@/providers/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileDropdown } from "@/components/layout/ProfileDropdown";

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/freelancers", label: "Find Freelancers", icon: Users },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/disputes", label: "Disputes", icon: Scale },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Portal", icon: Shield },
  { href: "/admin/disputes", label: "Disputes", icon: Scale },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Topbar() {
  const pathname = usePathname();
  const { dbUser } = useUserStore();
  const { signOut } = useAuth();

  // Only Clients (and Admins) see "Find Freelancers"; Freelancers manage their own contracts & work
  const navItems =
    dbUser?.role === "ADMIN"
      ? adminNavItems
      : dbUser?.role === "FREELANCER"
      ? userNavItems.filter((item) => item.href !== "/freelancers")
      : userNavItems;

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
                <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/verdiqt-icon.png"
                    alt="Verdiqt Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-display font-bold text-xl gradient-text">Verdiqt</span>
              </div>
              <nav className="px-3 py-4 space-y-1 flex-1">
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
              {/* User info + Sign Out */}
              <div className="px-3 py-4 border-t border-border mt-auto">
                <Link href="/profile" className="flex items-center gap-3 px-3 mb-3 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center flex-shrink-0 text-accent-primary text-xs font-semibold">
                    {dbUser?.avatarUrl ? (
                      <Image
                        src={dbUser.avatarUrl}
                        alt={dbUser.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{dbUser?.name ? dbUser.name.slice(0, 2).toUpperCase() : "U"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 truncate">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {dbUser?.name || "Loading..."}
                    </p>
                    <p className="text-[10px] font-mono text-accent-primary uppercase">
                      {dbUser?.role || ""}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-accent-danger hover:bg-accent-danger/10 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
              <Image
                src="/verdiqt-icon.png"
                alt="Verdiqt Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-semibold gradient-text">Verdiqt</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
