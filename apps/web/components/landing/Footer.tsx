"use client";

import Link from "next/link";
import Image from "next/image";
import { Scale, ArrowRight, Shield, CheckCircle2, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
          {/* Brand & Mission column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs">
                <Image
                  src="/verdiqt-icon.png"
                  alt="Verdiqt Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-xl text-slate-900 tracking-tight">
                Verdiqt
              </span>
            </Link>

            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              The milestone contract and AI-assisted dispute resolution platform
              for modern freelance work. Bringing structured contracts, simulated
              escrow tracking, and evidence-grounded mediation into one workflow.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Multi-Agent ODR Architecture • Indian Contract Act Grounded</span>
            </div>
          </div>

          {/* Navigation Links: Platform */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-xs text-slate-900 uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-accent-primary transition-colors">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-accent-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#ai-tribunal" className="hover:text-accent-primary transition-colors">
                  AI Tribunal Pipeline
                </a>
              </li>
              <li>
                <a href="#transparency" className="hover:text-accent-primary transition-colors">
                  Transparency & Trust
                </a>
              </li>
              <li>
                <Link href="/demo" className="hover:text-accent-primary transition-colors inline-flex items-center gap-1.5">
                  <span>Interactive Sandbox</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium">Demo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Links: Account & App */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-xs text-slate-900 uppercase tracking-wider">
              Application
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sign-in" className="hover:text-accent-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-accent-primary transition-colors">
                  Create Client Account
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-accent-primary transition-colors">
                  Join as Freelancer
                </Link>
              </li>
              <li>
                <Link href="/admin-login" className="hover:text-accent-primary transition-colors">
                  Administrator Portal
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-accent-primary transition-colors">
                  Simulated Wallet Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Transparency */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-xs text-slate-900 uppercase tracking-wider">
              Legal & Standards
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>ICA 1872 Sec 37 & 70</li>
              <li>Sec 65B BSA / IT Act 2000</li>
              <li>Simulated Escrow Ledger</li>
              <li>Explainable AI Reasoning</li>
              <li>SHA-256 Cryptographic Hash</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright Bottom Row */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="max-w-2xl">
            <p>
              © {currentYear} Verdiqt. All rights reserved. Verdiqt operates on a simulated escrow ledger and provides AI-assisted dispute resolution recommendations for workflow management and education. Recommendations are subject to party review, challenge, and human escalation.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-slate-400">
            <span>Next.js 16</span>
            <span>•</span>
            <span>Gemini 2.5 Flash</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Systems Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

