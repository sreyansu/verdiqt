"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  FileSearch,
  Scale,
  Brain,
  Hash,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  GitCommit,
  Clock,
  Layers,
  FileCheck2,
  AlertCircle,
} from "lucide-react";

interface Stage {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  summary: string;
  details: {
    label: string;
    value: string;
    highlight?: boolean;
  }[];
  codeSnippet?: {
    header: string;
    content: string;
  };
}

export function AiTribunalWorkflow() {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const stages: Stage[] = [
    {
      id: "quantum-meruit",
      step: "Stage 01",
      title: "Quantum Meruit Valuation",
      subtitle: "Deterministic Mathematical Baseline",
      badge: "Symbolic Baseline",
      icon: Calculator,
      summary:
        "Before LLM synthesis begins, a deterministic mathematical algorithm calculates fair financial boundaries based on approved deliverables, work in review, and verified delivery delays.",
      details: [
        { label: "Approved Milestones", value: "100% Value Allocated" },
        { label: "In-Review Deliverables", value: "50% Completion Estimate" },
        { label: "Liquidated Delay Factor", value: "-0.5% per Overdue Day (Capped at 25%)" },
        { label: "Deterministic Bounds", value: "[55% Min, 75% Max] Fair Freelancer Allocation", highlight: true },
      ],
      codeSnippet: {
        header: "Deterministic Formula Engine",
        content: `// Neuro-Symbolic Boundary Calculation
const lowerBound = Math.max(0, approvedRatio - delayPenalty);
const upperBound = Math.min(100, approvedRatio + inReviewRatio);
return { boundedRange: [lowerBound, upperBound] };`,
      },
    },
    {
      id: "forensic-audit",
      step: "Stage 02",
      title: "Forensic Evidence Auditor",
      subtitle: "Digital Record Integrity Review",
      badge: "Section 65B Audit",
      icon: FileSearch,
      summary:
        "Analyzes electronic records, screenshots, timestamps, and commit histories to test authenticity and probative value against statutory electronic evidence standards.",
      details: [
        { label: "Admissibility Standard", value: "Section 65B Digital Record Admissibility" },
        { label: "Evidence Strength", value: "Rated Strong / Moderate / Inconclusive" },
        { label: "Timestamp Verification", value: "Verified Against Project Milestones" },
        { label: "Auditor Finding", value: "Repository commits corroborate 65% of scope", highlight: true },
      ],
      codeSnippet: {
        header: "Forensic Auditor Verification",
        content: `FORENSIC FINDING:
✓ Electronic commit timestamp continuity verified
✓ Delivery files corroborate backend milestone completion
⚠ Mobile checkout browser bug confirmed present in test suite`,
      },
    },
    {
      id: "party-perspective",
      step: "Stage 03",
      title: "Party Perspective Analysis",
      subtitle: "Simulated Adversarial Deliberation",
      badge: "Multi-Agent Counsel",
      icon: Scale,
      summary:
        "Two specialized adversarial agents debate the dispute: a Client Advocate prosecuting contractual non-conformance, and a Freelancer Defense citing quantum meruit and scope creep.",
      details: [
        { label: "Client Advocate", value: "Prosecutes under ICA 1872 Sec 37 & Sec 73 damages" },
        { label: "Freelancer Defense", value: "Defends value transferred under ICA Sec 70 & scope creep" },
        { label: "3-Juror Panel", value: "Independent jury reviews corroborated facts only" },
        { label: "Adversarial Output", value: "Reconciles competing legal claims with facts", highlight: true },
      ],
      codeSnippet: {
        header: "Adversarial Deliberation Stream",
        content: `CLIENT ADVOCATE: "Material deviation from checkout specification under Sec 37."
FREELANCER DEFENSE: "Quantum Meruit applies; core gateway delivered. Client delayed API keys."
JURY PANEL: "Factual record confirms delay contributed by both parties."`,
      },
    },
    {
      id: "neutral-synthesis",
      step: "Stage 04",
      title: "Neutral AI Synthesis",
      subtitle: "Structured Recommendation Formulation",
      badge: "Chief Arbitrator",
      icon: Brain,
      summary:
        "The Chief Arbitrator synthesizes adversarial submissions and forensic findings, strictly constrained within the mathematical quantum meruit bounds, to deliver an explainable recommendation.",
      details: [
        { label: "Reasoning Structure", value: "Fact-based bulleted findings without hallucination" },
        { label: "Statutory Citations", value: "Cites relevant contractual and legal doctrines" },
        { label: "Proposed Allocation", value: "65% Freelancer / 35% Client Refund" },
        { label: "Confidence Assessment", value: "0.84 High (Escalates if below 0.60)", highlight: true },
      ],
      codeSnippet: {
        header: "Structured Recommendation JSON",
        content: `{
  "freelancerReleasePercent": 65,
  "clientRefundPercent": 35,
  "confidenceScore": 0.84,
  "escalatedToHuman": false,
  "legalBasis": "ICA 1872 Sec 70 Quantum Meruit with Sec 73 set-off"
}`,
      },
    },
    {
      id: "verification-layer",
      step: "Stage 05",
      title: "Verification Layer",
      subtitle: "Cryptographic Integrity Seal",
      badge: "SHA-256 Tamper Proof",
      icon: Hash,
      summary:
        "Generates a unique SHA-256 cryptographic hash combining the dispute terms, evidence checksums, recommended allocation, and timestamp to secure record immutability.",
      details: [
        { label: "Hashing Algorithm", value: "SHA-256 Cryptographic Digest" },
        { label: "Payload Signed", value: "Title + Terms + Amounts + Split + Timestamp" },
        { label: "Challenge Mechanism", value: "Either party may challenge within 2 attempts" },
        { label: "Integrity Status", value: "Immutable record verifiable by all parties", highlight: true },
      ],
      codeSnippet: {
        header: "Cryptographic Award Fingerprint",
        content: `AWARD HASH:
9f8e4a2c1b7d5e8f0a3b6c9d2e4f7a1b8c5e2d4f7a0b3c6e9d1f4a7b2c5e8f0a
Timestamp: 2026-11-16T12:00:00Z | Status: VERIFIED UNALTERED`,
      },
    },
  ];

  const currentStage = stages[activeStageIndex];

  return (
    <div className="space-y-12">
      {/* Interactive Process Pipeline Bar */}
      <div className="relative">
        {/* Subtle horizontal connecting line on desktop */}
        <div className="hidden lg:block absolute top-7 left-12 right-12 h-0.5 bg-slate-200 z-0" />

        {/* 5-step Pipeline Navigator */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === activeStageIndex;
            const isCompleted = idx < activeStageIndex;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageIndex(idx)}
                className={`relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 focus:outline-none ${
                  isActive
                    ? "bg-white border-accent-primary shadow-md ring-2 ring-accent-primary/15"
                    : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Step indicator top row */}
                <div className="flex items-center justify-between w-full mb-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-accent-primary text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-accent-primary/10 text-accent-primary"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stage.step}
                  </span>
                </div>

                <div className="font-display font-semibold text-xs text-slate-900 leading-snug line-clamp-1">
                  {stage.title}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {stage.badge}
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-accent-primary rounded-full hidden lg:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Stage Detail Inspector */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8"
        >
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Stage Explanation & Verification Criteria */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {currentStage.step} of 05
                  </span>
                  <span className="text-xs font-medium text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    {currentStage.subtitle}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {currentStage.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {currentStage.summary}
                </p>
              </div>

              {/* Key Verification Parameters */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {currentStage.details.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-left ${
                      item.highlight
                        ? "bg-indigo-50/50 border-indigo-200/80 text-accent-primary"
                        : "bg-slate-50/70 border-slate-200/70 text-slate-700"
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                      {item.label}
                    </div>
                    <div
                      className={`text-xs font-semibold ${
                        item.highlight ? "text-accent-primary" : "text-slate-800"
                      }`}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls to cycle stages */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400">
                  Select any stage above to inspect its execution criteria
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveStageIndex((prev) =>
                        prev === 0 ? stages.length - 1 : prev - 1
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setActiveStageIndex((prev) =>
                        prev === stages.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                  >
                    Next Stage
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Code & Data Artifact Output */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 p-4 shadow-lg overflow-hidden">
                {/* Code card header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[11px]">
                      {currentStage.codeSnippet?.header || "Inspection Output"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Live Stream
                  </span>
                </div>

                {/* Formatted Code / Output Stream */}
                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  <code>{currentStage.codeSnippet?.content}</code>
                </pre>

                {/* Micro audit badge */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Engine: Gemini 2.5 Flash</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

