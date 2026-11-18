"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Scale,
  User,
  LogOut,
  Shield,
  Users,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useUserStore } from "@/store/userStore";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProfileDropdown } from "@/components/layout/ProfileDropdown";

interface NavbarProps {
  onNavigate?: (id: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { dbUser, clearDbUser } = useUserStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 1. Public navigation items (Section 8: Home, Features, How it Works, AI Tribunal, Sandbox)
  const publicNavLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "AI Tribunal", href: "#ai-tribunal" },
    { label: "Sandbox", href: "/demo", badge: "Interactive" },
  ];

  // 2. Authenticated navigation items for Client & Freelancer (Section 8: Dashboard, Contracts, Disputes)
  const clientFreelancerNavLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Contracts", href: "/contracts", icon: FileText },
    { label: "Disputes", href: "/disputes", icon: Scale },
  ];

  // 3. Admin navigation items (Section 8: Admin Dashboard, Disputes, Users)
  const adminNavLinks = [
    { label: "Admin Dashboard", href: "/admin", icon: Shield },
    { label: "Disputes", href: "/admin/disputes", icon: Scale },
    { label: "Users", href: "/admin/users", icon: Users },
  ];

  // Consider authenticated if either Firebase user or persistent dbUser is present
  const isAuthenticated = Boolean(user || dbUser);
  const role = dbUser?.role || "CLIENT";
  const isAdmin = role === "ADMIN";
  const displayName = dbUser?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayEmail = dbUser?.email || user?.email || "";
  const displayAvatar = dbUser?.avatarUrl || user?.photoURL || null;

  const navLinks = !isAuthenticated
    ? publicNavLinks
    : isAdmin
    ? adminNavLinks
    : clientFreelancerNavLinks;

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    if (href === "/" && pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileMenuOpen(false);
      return;
    }

    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setMobileMenuOpen(false);
      onNavigate?.(targetId);
    } else {
      setMobileMenuOpen(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border shadow-xs py-3"
          : "bg-transparent border-b border-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* ── Brand Logo & Identity ── */}
          <Link
            href="/"
            onClick={(e) => handleLinkClick("/", e)}
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.01]"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/verdiqt-icon.png"
                alt="Verdiqt Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-text-primary">
                Verdiqt
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#B4935D]/10 text-[#9A7A3E] border border-[#B4935D]/30 shadow-2xs">
                ODR
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isAnchor = link.href.startsWith("#");
              const isActive =
                !isAnchor &&
                (link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href));

              const linkClasses = `px-3.5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-accent-primary/10 text-accent-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-slate-100/70"
              }`;

              return isAnchor ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(link.href, e)}
                  className={linkClasses}
                >
                  <span>{link.label}</span>
                  {"badge" in link && link.badge && (
                    <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                      {link.badge}
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(link.href, e)}
                  className={linkClasses}
                >
                  <span>{link.label}</span>
                  {"badge" in link && link.badge && (
                    <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Controls: Auth Actions, Role Indicator, Notifications, Profile Dropdown ── */}
          <div className="hidden md:flex items-center gap-3">
            {loading && !isAuthenticated ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {/* Role Indicator Pill */}
                {role === "ADMIN" ? (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
                    <Shield className="w-3 h-3 text-amber-600" />
                    <span>ADMIN</span>
                  </span>
                ) : role === "CLIENT" ? (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/30">
                    <Briefcase className="w-3 h-3 text-blue-600" />
                    <span>CLIENT</span>
                  </span>
                ) : (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>FREELANCER</span>
                  </span>
                )}

                {/* Real-time Notifications Bell */}
                <NotificationBell />

                {/* Profile Photo / Initials Dropdown & Logout */}
                <ProfileDropdown />
              </div>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-100 h-9 px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="h-9 px-4.5 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium text-sm rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5">
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger Button & Action ── */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationBell />}

            {!isAuthenticated && !loading && (
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="h-8 px-3 bg-accent-primary text-white text-xs font-medium rounded-lg"
                >
                  Get Started
                </Button>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-border bg-white rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {/* Authenticated User Header */}
              {isAuthenticated && (
                <div className="p-3 mb-2 rounded-xl bg-slate-50 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary font-semibold text-xs flex-shrink-0">
                      {displayAvatar ? (
                        <Image
                          src={displayAvatar}
                          alt={displayName}
                          width={36}
                          height={36}
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
                      <p className="text-xs text-text-secondary truncate">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                  {/* Role Badge */}
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary uppercase border border-accent-primary/20 flex-shrink-0">
                    {role}
                  </span>
                </div>
              )}

              {/* Navigation Links */}
              {navLinks.map((link) => {
                const isAnchor = link.href.startsWith("#");
                const isActive =
                  !isAnchor &&
                  (link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href));

                const linkClasses = `px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  isActive
                    ? "bg-accent-primary/10 text-accent-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-slate-50"
                }`;

                return isAnchor ? (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.href, e)}
                    className={linkClasses}
                  >
                    <span>{link.label}</span>
                    {"badge" in link && link.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                        {link.badge}
                      </span>
                    )}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.href, e)}
                    className={linkClasses}
                  >
                    <span>{link.label}</span>
                    {"badge" in link && link.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Authenticated Actions */}
              {isAuthenticated && (
                <div className="pt-2 mt-2 border-t border-border flex flex-col gap-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-accent-primary" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      clearDbUser();
                      signOut();
                    }}
                    className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-accent-danger hover:bg-red-50 flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              {/* Public Sign In & Sign Up Buttons */}
              {!isAuthenticated && !loading && (
                <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-center h-10 border-border text-sm font-medium"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full justify-center h-10 bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium shadow-xs">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
