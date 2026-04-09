"use client";


import {
  LayoutDashboard,
  FileText,
  Scale,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Play,
  User,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { useAuth } from "@/providers/AuthProvider";
const adminNavItems = [
  { href: "/admin", label: "Admin Portal", icon: Shield },
  { href: "/admin/disputes", label: "Disputes", icon: Scale },
  { href: "/admin/users", label: "Users", icon: Users },
];

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/disputes", label: "Disputes", icon: Scale },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/demo", label: "Demo", icon: Play },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { dbUser } = useUserStore();
  const { signOut } = useAuth();

  const navItems = dbUser?.role === "ADMIN" ? adminNavItems : userNavItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-border print:hidden"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 py-6 border-b border-border hover:bg-bg-elevated transition-colors">
        <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center flex-shrink-0">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display font-bold text-xl gradient-text"
            >
              Verdiqt
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? "bg-accent-primary/10 text-accent-primary font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? "text-accent-primary" : "group-hover:text-text-primary"
                }`}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User avatar + Collapse */}
      <div className="px-3 py-4 border-t border-border space-y-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "px-3 gap-3"}`}>
          <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-accent-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-text-primary truncate max-w-[150px]"
              >
                {dbUser?.name || "Loading..."}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          
          {!collapsed && (
            <button
              onClick={signOut}
              className="flex-1 flex items-center justify-center p-2 rounded-lg text-accent-danger hover:bg-accent-danger/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={signOut}
              className="flex-1 flex items-center justify-center p-2 rounded-lg text-accent-danger hover:bg-accent-danger/10 transition-colors mt-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
