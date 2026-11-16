"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Lock,
  Brain,
  Scale,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Calculator,
  FolderGit2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  GitBranch,
  Layers,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  Hash,
  Users,
  Check,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { HeroProductPreview } from "@/components/landing/HeroProductPreview";
import { AiTribunalWorkflow } from "@/components/landing/AiTribunalWorkflow";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  // 6 Core Features
  const coreFeatures = [
    {
      icon: FileText,
      title: "Smart Contract Management",
      description:
        "Create structured milestone-based agreements with clear scope descriptions, delivery deadlines, and defined monetary valuations.",
      accent: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-200",
    },
    {
      icon: Lock,
      title: "Simulated Escrow",
      description:
        "Track funds held against contractual milestones using the platform's simulated demo wallet, providing visible balance guarantees before work begins.",
      accent: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "hover:border-cyan-200",
    },
    {
      icon: FolderGit2,
      title: "Evidence Intelligence",
      description:
        "Organize submitted files, code links, and chat exports into a centralized digital registry associated directly with contested contractual clauses.",
      accent: "text-violet-600",
      bg: "bg-violet-50",
      border: "hover:border-violet-200",
    },
    {
      icon: Brain,
      title: "AI-Assisted Mediation",
      description:
        "Analyse contracts, party statements, and submitted evidence through a structured multi-agent workflow rather than an unpredictable single prompt.",
      accent: "text-amber-600",
      bg: "bg-amber-50",
      border: "hover:border-amber-200",
    },
    {
      icon: FileCheck2,
      title: "Explainable Recommendations",
      description:
        "Receive transparent, structured recommendations with bulleted reasoning, confidence metrics, and explicit statutory legal citations.",
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-200",
    },
    {
      icon: Calculator,
      title: "Transparent Fund Allocation",
      description:
        "Calculate proposed settlement splits using deterministic Quantum Meruit formulas and liquidated delay deductions to eliminate arbitrary splits.",
      accent: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-200",
    },
  ];

  // 6 How It Works Steps
  const steps = [
    {
      step: "01",
      title: "Create an Agreement",
      description:
        "The client drafts a project, sets milestones, defines deliverables, and invites the freelancer by email.",
      meta: "Status: DRAFT",
    },
    {
      step: "02",
      title: "Secure the Workflow",
      description:
        "The freelancer accepts the terms, locking the contract value into the simulated escrow ledger from the client's balance.",
      meta: "Status: ACTIVE",
    },
    {
      step: "03",
      title: "Complete & Review Work",
      description:
        "The freelancer submits deliverables and evidence. Approved milestones trigger instant automated fund releases.",
      meta: "Automated Payout",
    },
    {
      step: "04",
      title: "Resolve Disagreements",
      description:
        "If deliverables are disputed, escrow is frozen immediately. Both parties submit formal statements and supporting evidence.",
      meta: "Status: DISPUTED",
    },
    {
      step: "05",
      title: "AI-Assisted Analysis",
      description:
        "Verdiqt's multi-agent tribunal evaluates scope, conducts forensic evidence checks, and bounds financial splits with quantum meruit math.",
      meta: "Multi-Agent ODR",
    },
    {
      step: "06",
      title: "Review the Recommendation",
      description:
        "Both parties inspect the structured recommendation, accept the proposed settlement, or challenge it for administrative oversight.",
      meta: "Cryptographic Seal",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-slate-900 selection:bg-accent-primary/10 selection:text-accent-primary flex flex-col font-sans">
      {/* ── Section 1: Navigation Bar ── */}
      <Navbar />

      <main className="flex-1">
        {/* ── Section 2: Hero Section ── */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
          {/* Subtle background mesh gradient */}
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/60 via-slate-50/30 to-transparent pointer-events-none" />
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-tr from-indigo-200/20 via-cyan-100/30 to-purple-200/20 blur-3xl pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Value Proposition & Hero CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:col-span-6 text-center lg:text-left space-y-6"
              >
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                  <span className="text-xs font-mono font-medium tracking-wide text-slate-700 uppercase">
                    AI-ASSISTED FREELANCE DISPUTE RESOLUTION
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                  Freelance Contracts. <br />
                  Clear Agreements. <br />
                  <span className="gradient-text">Fairer Resolutions.</span>
                </h1>

                {/* Supporting Text */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Manage milestone-based contracts, protect payments with
                  simulated escrow, and resolve disagreements through
                  evidence-grounded AI recommendations.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <Link href="/sign-up" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto h-12 px-7 bg-accent-primary hover:bg-accent-primary/95 text-white font-medium text-base rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>

                  <a href="#how-it-works" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto h-12 px-6 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base rounded-xl transition-all"
                    >
                      Explore How It Works
                    </Button>
                  </a>
                </div>

                {/* 3 Trust Indicators */}
                <div className="pt-6 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      Milestone-Based Contracts
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      Transparent Evidence Analysis
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      Explainable AI Recommendations
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: High-Fidelity Product Preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                className="lg:col-span-6"
              >
                <HeroProductPreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Problem and Solution ── */}
        <section className="py-20 md:py-24 bg-white border-y border-slate-200/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-mono font-semibold text-accent-primary uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                The Disconnect In Freelancing
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Freelancing Shouldn&apos;t Mean Financial Uncertainty.
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                When project delivery breaks down, traditional freelance workflows
                rely on fragmented messaging, ambiguous terms, and unilateral payment
                withholding.
              </p>
            </div>

            {/* 3 Problem Cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="p-6 sm:p-7 rounded-2xl bg-[#FAFBFC] border border-slate-200 hover:border-slate-300 transition-all text-left space-y-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900">
                  Payment Disputes
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Disagreements over incomplete work, delayed payments, and
                  unapproved milestones leave freelancers unpaid and clients
                  without working deliverables.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="p-6 sm:p-7 rounded-2xl bg-[#FAFBFC] border border-slate-200 hover:border-slate-300 transition-all text-left space-y-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900">
                  Unclear Expectations
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Contract requirements and actual deliverables frequently
                  become misaligned as scope changes occur informally across chat
                  apps without formal documentation.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="p-6 sm:p-7 rounded-2xl bg-[#FAFBFC] border border-slate-200 hover:border-slate-300 transition-all text-left space-y-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900">
                  Difficult Evidence Review
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Emails, design links, zip files, screenshots, and development
                  repositories are scattered across multiple tools, making
                  objective review arduous.
                </p>
              </motion.div>
            </div>

            {/* Solution Transition Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white relative overflow-hidden shadow-lg">
              <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-accent-primary/20 to-transparent pointer-events-none" />
              <div className="max-w-3xl space-y-3 relative z-10 text-left">
                <div className="inline-flex items-center gap-2 text-indigo-300 text-xs font-mono tracking-wider uppercase font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>The Verdiqt Approach</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  One Unified Workflow for Contracts, Evidence, & Mediation
                </h3>
                <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed">
                  Verdiqt bridges contracts and execution by structuring
                  milestones upfront, anchoring funds in simulated escrow, and
                  organizing digital evidence into an explainable multi-agent
                  recommendation pipeline when conflicts arise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Core Features ── */}
        <section id="features" className="py-20 md:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-mono font-semibold text-accent-primary uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                End-To-End Architecture
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Designed for Transparency and Speed
              </h2>
              <p className="text-slate-600 text-base sm:text-lg">
                Explore the six pillars powering Verdiqt&apos;s contract governance
                and dispute resolution system.
              </p>
            </div>

            {/* 6 Feature Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    className={`bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 text-left space-y-4 ${feat.border}`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${feat.bg} flex items-center justify-center ${feat.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display font-semibold text-lg text-slate-900">
                        {feat.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 5: How It Works ── */}
        <section
          id="how-it-works"
          className="py-20 md:py-24 bg-white border-t border-slate-200/80 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-mono font-semibold text-accent-primary uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Step-by-Step Lifecycle
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                How It Works: From Scope to Settlement
              </h2>
              <p className="text-slate-600 text-base sm:text-lg">
                A predictable, standardized pathway designed to keep projects
                on track and resolve conflicts amicably.
              </p>
            </div>

            {/* Step-by-Step Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {steps.map((st, i) => (
                <div
                  key={st.step}
                  className="bg-[#FAFBFC] border border-slate-200/90 rounded-2xl p-6 text-left relative flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-2xl text-accent-primary">
                        {st.step}
                      </span>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {st.meta}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-slate-900">
                      {st.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {st.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Workflow Stage {i + 1} of 6</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Sandbox Link */}
            <div className="mt-12 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 max-w-xl mx-auto">
                <span className="text-xs text-indigo-900 font-medium">
                  Want to test the full 8-step lifecycle interactively with sample data?
                </span>
                <Link href="/demo">
                  <Button
                    size="sm"
                    className="bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-medium h-8 px-4 rounded-lg shrink-0"
                  >
                    Launch Interactive Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: Inside the AI Tribunal (Flagship Showcase) ── */}
        <section
          id="ai-tribunal"
          className="py-20 md:py-28 bg-[#FAFBFC] border-t border-slate-200/80 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
              <span className="text-xs font-mono font-semibold text-accent-primary uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                AI Mediation Architecture
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
                More Than a Chatbot. <br className="hidden sm:inline" />
                A Structured Reasoning Workflow.
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Rather than relying on ungrounded single-prompt answers, Verdiqt
                implements a five-stage reasoning pipeline combining deterministic
                financial boundaries, forensic evidence verification, and multi-agent
                adversarial deliberation.
              </p>
            </div>

            {/* Interactive 5-Stage Tribunal Showcase Component */}
            <AiTribunalWorkflow />
          </div>
        </section>

        {/* ── Section 7: Transparency and Trust ── */}
        <section
          id="transparency"
          className="py-20 md:py-24 bg-white border-t border-slate-200/80 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Transparency Commitments */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-semibold text-accent-primary uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    Trust & Explainability
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    Every Recommendation is Explainable and Auditable.
                  </h2>
                </div>

                <p className="text-slate-600 text-base leading-relaxed">
                  We believe automated dispute resolution cannot be a black box.
                  Verdiqt provides complete visibility into how recommendations
                  are reached, giving both parties verifiable confidence.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">
                        Evidence-Grounded Reasoning
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Every finding references specific contractual clauses,
                        uploaded artifacts, and corroborated digital timestamps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">
                        Structured Financial Calculations
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Quantum Meruit rules enforce mathematical bounds so neither
                        party is subjected to arbitrary split percentages.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">
                        Human Escalation & Challenge Rights
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Parties may challenge an AI recommendation up to two times or
                        escalate directly for human administrator review if confidence is low.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">
                        Recorded Cryptographic Integrity
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Every recommendation is stamped with a SHA-256 hash to
                        guarantee that historical case findings remain unaltered.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sample Recommendation Inspector Card */}
              <div className="lg:col-span-6">
                <div className="bg-[#FAFBFC] rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-7 text-left space-y-5">
                  {/* Top card metadata */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-accent-primary" />
                      <span className="font-display font-semibold text-sm text-slate-900">
                        Recommendation Breakdown
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Confidence: 84% (High)
                    </span>
                  </div>

                  {/* Fund Split Visualization */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        Freelancer Allocation: 65% (₹65,000)
                      </span>
                      <span className="font-medium text-slate-700">
                        Client Refund: 35% (₹35,000)
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex">
                      <div className="bg-accent-primary h-full w-[65%]" title="Freelancer: 65%" />
                      <div className="bg-cyan-500 h-full w-[35%]" title="Client: 35%" />
                    </div>
                  </div>

                  {/* Rationale Bullet points */}
                  <div className="space-y-2 text-xs">
                    <div className="font-medium text-slate-700">
                      Reasoning Basis:
                    </div>
                    <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                      <li>
                        Milestones 1 & 2 were previously approved by client without objection.
                      </li>
                      <li>
                        Milestone 3 core API webhook was verified delivered; secondary iOS browser styling defect confirmed.
                      </li>
                      <li>
                        Quantum Meruit calculation grants 70% value on contested milestone with a 5% delay penalty deduction.
                      </li>
                    </ul>
                  </div>

                  {/* Legal Basis & Statutory grounds */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Statutory Legal Grounds Cited
                    </span>
                    <p className="font-mono text-[11px] text-slate-700">
                      Indian Contract Act 1872 Section 70 (Quantum Meruit) with Section 73 damage deduction; BSA Sec 65B electronic record compliance.
                    </p>
                  </div>

                  {/* Tamper-Proof Stamp */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-accent-primary" />
                      <span>SHA-256: 7f8a9e...c41b</span>
                    </span>
                    <span className="text-emerald-600 font-medium">
                      Tamper-Proof Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 8: Final Call to Action ── */}
        <section className="py-20 md:py-24 bg-gradient-to-b from-[#FAFBFC] to-indigo-50/40 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md space-y-6 text-center relative overflow-hidden"
            >
              {/* Background ambient corner shine */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-accent-primary flex items-center justify-center mx-auto border border-indigo-100">
                <Scale className="w-6 h-6" />
              </div>

              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  Make Every Freelance Agreement More Transparent.
                </h2>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                  Bring contracts, milestone payments, and evidence-based dispute
                  analysis together in one platform.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 bg-accent-primary hover:bg-accent-primary/95 text-white font-medium text-base rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link href="/sign-in" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-7 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base rounded-xl transition-all"
                  >
                    Sign In
                  </Button>
                </Link>

                <Link href="/demo" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-5 text-accent-primary hover:bg-indigo-50 text-sm font-medium rounded-xl transition-all"
                  >
                    Explore Sandbox Demo
                  </Button>
                </Link>
              </div>

              {/* No credit card / instant demo note */}
              <div className="pt-2 text-xs text-slate-400">
                Free tier accounts include simulated escrow balances to test contracts and disputes immediately.
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Section 9: Footer ── */}
      <Footer />
    </div>
  );
}
