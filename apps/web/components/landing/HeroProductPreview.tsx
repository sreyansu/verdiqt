"use client";

import { useState } from "react";
import {
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Brain,
  GitBranch,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroProductPreview() {
  const [activeTab, setActiveTab] = useState<"evidence" | "milestones">("evidence");

  return (
    <div className="relative w-full max-w-2xl mx-auto lg:max-w-none">
      {/* Ambient background glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-primary/20 via-accent-secondary/20 to-indigo-500/20 rounded-3xl blur-xl opacity-70 transform -rotate-1 pointer-events-none" />

      {/* Main card container mimicking a sleek modern app window */}
      <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden text-left">
        {/* Window Chrome / Title Bar */}
        <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <span>contracts</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">CNT-2026-084</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Dispute: Under Review
            </span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Contract Overview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-lg text-slate-900 tracking-tight">
                  Website Development & Portal
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  Milestone Contract
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>Client: Acme Studio</span>
                <span>•</span>
                <span>Freelancer: Nova Devs</span>
              </p>
            </div>

            {/* Financial Metrics */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Simulated Escrow
                </span>
                <span className="font-mono text-lg font-bold text-slate-900">
                  ₹1,00,000
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-accent-primary border border-indigo-100">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Progress & Milestone Overview */}
          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-success" />
                Milestone Progress: 2 of 4 Completed
              </span>
              <span className="font-mono font-medium text-slate-600">50% Released</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 h-2 mb-3">
              <div className="bg-accent-success rounded-full" title="M1: UX Specs (Approved)" />
              <div className="bg-accent-success rounded-full" title="M2: Frontend Shell (Approved)" />
              <div className="bg-amber-500 rounded-full animate-pulse" title="M3: API Integration (Disputed)" />
              <div className="bg-slate-200 rounded-full" title="M4: Deployment (Pending)" />
            </div>

            {/* 4 Milestones Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80 text-left">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-slate-500">M1: Wireframes</span>
                  <CheckCircle2 className="w-3 h-3 text-accent-success" />
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800">₹25,000</div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200/80 text-left">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-slate-500">M2: UI Build</span>
                  <CheckCircle2 className="w-3 h-3 text-accent-success" />
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800">₹25,000</div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-amber-300 ring-1 ring-amber-400/30 text-left bg-amber-50/30">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-amber-800 font-medium">M3: API Core</span>
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                </div>
                <div className="font-mono text-xs font-semibold text-amber-900">₹30,000</div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200/80 text-left opacity-75">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-slate-400">M4: QA Deploy</span>
                  <Clock className="w-3 h-3 text-slate-400" />
                </div>
                <div className="font-mono text-xs font-semibold text-slate-600">₹20,000</div>
              </div>
            </div>
          </div>

          {/* AI Evidence Analysis & Mediation Panel */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-900">
                  AI Evidence Analysis & Structured Triage
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                Multi-Agent ODR
              </span>
            </div>

            {/* Evidence items checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/70">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Contract obligation identified</span>
                    <span className="text-[10px] font-mono text-slate-400">Clause 3.2</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Milestone 3 specified OAuth login, payment webhook & checkout flow.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/70">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <GitBranch className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">GitHub evidence matched</span>
                    <span className="text-[10px] font-mono text-emerald-600 font-medium">92% Match</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Commit history and PR #18 verify webhook implementation on staging.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200/70">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">Deliverable requires verification</span>
                    <span className="text-[10px] font-mono text-amber-700 font-medium">Ambiguity</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Client notes edge-case payment gateway timeout on iOS mobile browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-indigo-50/50 border border-indigo-200/60">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 text-accent-primary flex items-center justify-center shrink-0">
                  <Scale className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-accent-primary">Preliminary Split Recommendation</span>
                    <span className="text-[10px] font-mono font-semibold text-accent-primary">70% / 30%</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Quantum Meruit baseline calculates ₹21,000 to Freelancer, ₹9,000 refund to Client.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom recommendation audit line */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-indigo-100/80 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-primary" />
                <span>Recorded SHA-256 Hash: <code className="font-mono text-slate-700">8b4f...3c9a</code></span>
              </div>
              <span className="text-slate-500 italic">
                Parties may accept or lodge challenge
              </span>
            </div>
          </div>
        </div>

        {/* Caption footer explicitly stating this is a representative preview */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Representative product preview. Simulated escrow workflow.</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">v2.4 ODR Engine</span>
        </div>
      </div>
    </div>
  );
}

