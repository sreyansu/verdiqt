"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Scale, ArrowRight, Menu, X, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onNavigate?: (id: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "AI Tribunal", href: "#ai-tribunal" },
    { label: "Transparency", href: "#transparency" },
    { label: "Sandbox", href: "/demo", badge: "Interactive" },
  ];

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
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

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-border shadow-xs py-3"
          : "bg-transparent border-b border-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left: Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.01]"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-primary flex items-center justify-center shadow-xs transition-colors group-hover:bg-accent-primary/95">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-text-primary">
                Verdiqt
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                ODR
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(link.href, e)}
                className="px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100/70 transition-colors flex items-center gap-1.5"
              >
                {link.label}
                {link.badge && (
                  <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Right: Authentication Actions */}
          <div className="hidden md:flex items-center gap-3">
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
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/sign-up">
              <Button
                size="sm"
                className="h-8 px-3 bg-accent-primary text-white text-xs font-medium rounded-lg"
              >
                Get Started
              </Button>
            </Link>
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-border bg-white rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(link.href, e)}
                  className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                      {link.badge}
                    </span>
                  )}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-center h-10 border-border text-sm font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center h-10 bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium shadow-xs">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

