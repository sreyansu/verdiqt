"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  LayoutDashboard,
  FileText,
  Scale,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useUserStore } from "@/store/userStore";

export function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const { dbUser, clearDbUser } = useUserStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (!user && !dbUser) return null;

  const displayName = dbUser?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayEmail = dbUser?.email || user?.email || "";
  const displayAvatar = dbUser?.avatarUrl || user?.photoURL || null;
  const role = dbUser?.role || "CLIENT";
  const isAdmin = role === "ADMIN";
  const isClient = role === "CLIENT";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    clearDbUser();
    await signOut();
    router.push("/");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
        aria-label="User profile menu"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary font-semibold text-xs flex-shrink-0">
          {displayAvatar ? (
            <Image
              src={displayAvatar}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getInitials(displayName)}</span>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-text-secondary hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3.5 border-b border-border bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary font-semibold text-sm flex-shrink-0">
                {displayAvatar ? (
                  <Image
                    src={displayAvatar}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(displayName)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs text-text-secondary truncate">{displayEmail}</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      isAdmin
                        ? "bg-amber-500/10 text-amber-700 border border-amber-500/30"
                        : isClient
                        ? "bg-blue-500/10 text-blue-700 border border-blue-500/30"
                        : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                    }`}
                  >
                    {isAdmin ? (
                      <Shield className="w-2.5 h-2.5" />
                    ) : isClient ? (
                      <Briefcase className="w-2.5 h-2.5" />
                    ) : (
                      <UserCheck className="w-2.5 h-2.5" />
                    )}
                    <span>{role}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-1.5 space-y-0.5">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Admin Dashboard</span>
                </Link>
                <Link
                  href="/admin/disputes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Scale className="w-4 h-4 text-accent-secondary" />
                  <span>All Disputes</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-accent-primary" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/contracts"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4 text-accent-secondary" />
                  <span>Contracts</span>
                </Link>
                <Link
                  href="/disputes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Disputes</span>
                </Link>
              </>
            )}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Edit Profile</span>
            </Link>
          </div>

          {/* Logout Action */}
          <div className="p-1.5 border-t border-border">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-accent-danger hover:bg-red-50 rounded-lg transition-colors text-left font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
