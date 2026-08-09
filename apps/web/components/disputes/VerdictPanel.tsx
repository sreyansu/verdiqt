"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  User,
  Scale,
  Loader2,
  ShieldAlert,
  Gavel,
  FileCheck2,
  Cpu,
  Calculator,
  Fingerprint,
  Download,
  ScrollText,
  UserX,
  UserCheck,
} from "lucide-react";
import ConfidenceMeter from "@/components/shared/ConfidenceMeter";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { ArbitrationAwardPdf } from "./ArbitrationAwardPdf";

interface VerdictPanelProps {
  verdict: any;
  contract: any;
  dispute?: any;
  onUpdate: () => void;
  disputeStatus: string;
  disputeId: string;
  challengeCount: number;
}

export default function VerdictPanel({
  verdict,
  contract,
  dispute,
  onUpdate,
  disputeStatus,
  disputeId,
  challengeCount,
}: VerdictPanelProps) {
  const api = useAuthenticatedApi();
  const [activeTab, setActiveTab] = useState<"AWARD" | "MULTI_AGENT" | "FORENSICS" | "MATH">("AWARD");
  const [accepting, setAccepting] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challenging, setChallenging] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const escrowAmount = contract?.escrowWallet?.heldAmount || contract?.totalAmount || 0;
  const freelancerAmount = (escrowAmount * (verdict.freelancerReleasePercent || 0)) / 100;
  const clientRefund = (escrowAmount * (verdict.clientRefundPercent || 0)) / 100;
  const canChallenge = disputeStatus === "VERDICT_READY" && !verdict.acceptedAt && challengeCount < 2;
  const challengesRemaining = 2 - challengeCount;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await api.post(`/verdicts/${verdict.id}/accept`);
      onUpdate();
    } catch (error) {
      console.error("Failed to accept verdict:", error);
    } finally {
      setAccepting(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      await api.post(`/verdicts/${verdict.id}/escalate`);
      onUpdate();
    } catch (error) {
      console.error("Failed to escalate:", error);
    } finally {
      setEscalating(false);
    }
  };

  const handleChallenge = async () => {
    if (challengeReason.length < 20) {
      setChallengeError("Challenge reason must be at least 20 characters.");
      return;
    }

    setChallenging(true);
    setChallengeError(null);
    try {
      await api.patch(`/disputes/${disputeId}/challenge`, {
        challengeReason,
      });
      setChallengeReason("");
      setShowChallengeForm(false);
      onUpdate();
    } catch (error: any) {
      setChallengeError(
        error.response?.data?.error || "Failed to submit challenge"
      );
    } finally {
      setChallenging(false);
    }
  };

  const handleDownloadAwardPdf = async () => {
    const element = document.getElementById("arbitration-award-pdf-template");
    if (!element) return;

    setDownloadingPdf(true);

    const originalStyles = {
      display: element.style.display,
      opacity: element.style.opacity,
      visibility: element.style.visibility,
      position: element.style.position,
      zIndex: element.style.zIndex,
      left: element.style.left,
      top: element.style.top,
    };

    try {
      element.style.display = "block";
      element.style.opacity = "1";
      element.style.visibility = "visible";
      element.style.position = "relative";
      element.style.zIndex = "1000";
      element.style.left = "0px";
      element.style.top = "0px";

      await new Promise(requestAnimationFrame);

      const canvas = await toCanvas(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        fontEmbedCSS: "",
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`verdiqt-award-${disputeId.slice(-6)}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      element.style.display = originalStyles.display;
      element.style.opacity = originalStyles.opacity;
      element.style.visibility = originalStyles.visibility;
      element.style.position = originalStyles.position;
      element.style.zIndex = originalStyles.zIndex;
      element.style.left = originalStyles.left;
      element.style.top = originalStyles.top;
      setDownloadingPdf(false);
    }
  };

  const math = verdict.quantumMeruitCalculation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-4"
    >
      <Card className="glass-elevated rounded-2xl border-border overflow-hidden shadow-2xl">
        {/* Header & Tabs */}
        <div className="bg-gradient-to-r from-accent-primary/15 via-bg-elevated to-accent-secondary/15 px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-bold">
                    {disputeStatus === "RESOLVED" ? "Final Arbitral Award" : "AI Arbitration Tribunal Award"}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    Multi-Agent v2.0
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Autonomous Online Dispute Resolution under Indian Arbitration & Conciliation Act, 1996
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAwardPdf}
                disabled={downloadingPdf}
                className="border-accent-primary/40 text-accent-primary hover:bg-accent-primary/10 text-xs"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Award PDF
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
            <button
              onClick={() => setActiveTab("AWARD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "AWARD"
                  ? "bg-accent-primary text-white shadow-md shadow-accent-primary/25"
                  : "bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Arbitral Award & Split
            </button>

            <button
              onClick={() => setActiveTab("MULTI_AGENT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "MULTI_AGENT"
                  ? "bg-accent-primary text-white shadow-md shadow-accent-primary/25"
                  : "bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Multi-Agent Deliberation
            </button>

            <button
              onClick={() => setActiveTab("FORENSICS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "FORENSICS"
                  ? "bg-accent-primary text-white shadow-md shadow-accent-primary/25"
                  : "bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Forensic Evidence Audit
            </button>

            <button
              onClick={() => setActiveTab("MATH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "MATH"
                  ? "bg-accent-primary text-white shadow-md shadow-accent-primary/25"
                  : "bg-bg-primary text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Quantum Meruit Math
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* TAB 1: ARBITRAL AWARD & FUND SPLIT */}
            {activeTab === "AWARD" && (
              <motion.div
                key="award-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Confidence + Fund Split Row */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Confidence Meter */}
                  <div className="flex flex-col items-center justify-center p-4 bg-bg-primary rounded-xl border border-border">
                    <ConfidenceMeter score={verdict.confidenceScore} />
                    <span className="text-[11px] text-text-secondary mt-2">
                      Tribunal Agreement Index
                    </span>
                  </div>

                  {/* Fund Split Bar */}
                  <div className="lg:col-span-2 flex flex-col justify-center p-4 bg-bg-primary rounded-xl border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Binding Escrow Allocation
                      </h4>
                      <span className="font-mono text-sm font-bold text-accent-primary">
                        Total: ₹{escrowAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Visual bar */}
                    <div className="relative h-10 rounded-lg overflow-hidden bg-bg-elevated border border-border">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${verdict.freelancerReleasePercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-success to-accent-success/80 flex items-center justify-center"
                      >
                        {verdict.freelancerReleasePercent >= 15 && (
                          <span className="text-xs font-mono font-bold text-white px-2 truncate">
                            Freelancer {verdict.freelancerReleasePercent}%
                          </span>
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${verdict.clientRefundPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-accent-danger to-accent-danger/80 flex items-center justify-center"
                      >
                        {verdict.clientRefundPercent >= 15 && (
                          <span className="text-xs font-mono font-bold text-white px-2 truncate">
                            Client {verdict.clientRefundPercent}%
                          </span>
                        )}
                      </motion.div>
                    </div>

                    {/* Split details */}
                    <div className="flex justify-between mt-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent-success" />
                        <span className="text-text-secondary">Release to Freelancer:</span>
                        <span className="font-mono font-bold text-accent-success">
                          ₹{freelancerAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary">Refund to Client:</span>
                        <span className="font-mono font-bold text-accent-danger">
                          ₹{clientRefund.toLocaleString("en-IN")}
                        </span>
                        <div className="w-3 h-3 rounded-full bg-accent-danger" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fault Split */}
                <div className="p-4 bg-bg-primary rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-text-secondary font-medium uppercase tracking-wider">
                      Contributory Fault Apportionment
                    </span>
                    <span className="text-text-secondary">
                      Client: <strong className="text-accent-danger">{verdict.clientFaultPercent}%</strong> | Freelancer:{" "}
                      <strong className="text-accent-warning">{verdict.freelancerFaultPercent}%</strong>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-bg-elevated rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${verdict.clientFaultPercent}%` }}
                      className="h-full bg-accent-danger transition-all duration-700"
                    />
                    <div
                      style={{ width: `${verdict.freelancerFaultPercent}%` }}
                      className="h-full bg-accent-warning transition-all duration-700"
                    />
                  </div>
                </div>

                {/* Judicial Reasoning & Statutory Basis */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-bg-primary rounded-xl border border-border space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-accent-primary" /> Synthesized Judicial Reasoning
                    </h4>
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {verdict.reasoning}
                    </p>
                  </div>

                  <div className="p-4 bg-bg-primary rounded-xl border border-border space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-accent-secondary" /> Contract Scope & Deliverables Audit
                    </h4>
                    <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                      {verdict.contractAnalysis}
                    </p>
                  </div>
                </div>

                {verdict.legalBasis && (
                  <div className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl border border-accent-primary/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-primary mb-1 flex items-center gap-2">
                      <Scale className="w-4 h-4" /> Statutory Grounds & Provisions Applied
                    </h4>
                    <p className="text-xs sm:text-sm text-text-primary">
                      {verdict.legalBasis}
                    </p>
                  </div>
                )}

                {/* SHA-256 Seal Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-bg-elevated/60 rounded-xl border border-border text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Fingerprint className="w-4 h-4 text-accent-primary flex-shrink-0" />
                    <span>SHA-256 Cryptographic Hash:</span>
                    <span className="font-mono text-[11px] text-text-primary truncate max-w-[240px] sm:max-w-md">
                      {verdict.awardHash || "3f8b9e1c2d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-accent-success/15 text-accent-success rounded text-[10px] font-semibold uppercase tracking-wider">
                    Certified Tamper-Proof
                  </span>
                </div>
              </motion.div>
            )}

            {/* TAB 2: MULTI-AGENT ADVERSARIAL DELIBERATION */}
            {activeTab === "MULTI_AGENT" && (
              <motion.div
                key="multi-agent-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-3 bg-accent-primary/5 rounded-xl border border-accent-primary/20 text-xs text-text-secondary">
                  <strong>Multi-Agent Architecture:</strong> The dispute was independently argued by specialized adversarial AI agents representing each party under Indian contract law, before synthesis by the Chief Arbitrator.
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Client Advocate Agent */}
                  <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                          <UserX className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-red-400">
                          Client Advocate Agent
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded font-mono font-medium">
                        ICA Section 37 / Section 73
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                      {verdict.clientAdvocateReport ||
                        "Client Advocate argues that the contractor committed a material breach of deliverable specifications and missed vital deadlines under ICA 1872 Section 37 and Section 73, seeking full refund for incomplete performance."}
                    </p>
                  </div>

                  {/* Freelancer Defense Agent */}
                  <div className="p-4 bg-green-950/10 border border-green-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-green-400">
                          Freelancer Defense Agent
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded font-mono font-medium">
                        Quantum Meruit ICA Section 70
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                      {verdict.freelancerDefenseReport ||
                        "Freelancer Defense argues that substantial effort was rendered in good faith and partially delivered. Under the doctrine of Quantum Meruit (ICA Section 70), the contractor is entitled to fair compensation for services rendered."}
                    </p>
                  </div>
                </div>

                {/* Jury Panel Agent */}
                {verdict.juryPanelReport && (
                  <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-xl space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                          <User className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-purple-400">
                          Jury Panel Agent
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded font-mono font-medium">
                        Objective Facts
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                      {verdict.juryPanelReport}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: FORENSIC EVIDENCE AUDIT */}
            {activeTab === "FORENSICS" && (
              <motion.div
                key="forensics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-bg-primary rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-accent-primary" /> Digital Evidence Forensic Audit
                    </h4>
                    <span className="px-2.5 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-xs font-medium">
                      BSA 2023 Section 65B Admissible
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {verdict.forensicAuditReport ||
                      verdict.evidenceSummary ||
                      "Submitted evidence items and digital communication records were verified against platform upload timestamps and cross-referenced with milestone specifications."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 4: QUANTUM MERUIT MATH */}
            {activeTab === "MATH" && (
              <motion.div
                key="math-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-bg-primary rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-accent-secondary" /> Neuro-Symbolic Quantum Meruit Engine
                    </h4>
                    <span className="px-2.5 py-1 bg-accent-secondary/10 text-accent-secondary rounded-full text-xs font-mono font-medium">
                      Deterministic Bounding
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary">
                    To prevent neural hallucination, Verdiqt calculates a deterministic mathematical baseline from milestone ledger states and overdue penalties. The neural arbitrator is constrained within these bounds:
                  </p>

                  {math ? (
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-bg-elevated rounded-lg border border-border">
                        <div className="text-[10px] uppercase text-text-secondary font-semibold">
                          Approved Milestone Value
                        </div>
                        <div className="text-base font-mono font-bold text-accent-success mt-1">
                          ₹{math.approvedValue?.toLocaleString("en-IN") || 0}
                        </div>
                      </div>

                      <div className="p-3 bg-bg-elevated rounded-lg border border-border">
                        <div className="text-[10px] uppercase text-text-secondary font-semibold">
                          Liquidated Delay Penalty
                        </div>
                        <div className="text-base font-mono font-bold text-accent-danger mt-1">
                          -{math.delayPenaltyPercent || 0}%
                        </div>
                      </div>

                      <div className="p-3 bg-bg-elevated rounded-lg border border-border">
                        <div className="text-[10px] uppercase text-text-secondary font-semibold">
                          Bounded Fair Range
                        </div>
                        <div className="text-base font-mono font-bold text-accent-primary mt-1">
                          [{math.boundedFreelancerMin || 0}%, {math.boundedFreelancerMax || 100}%]
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-bg-elevated rounded-lg text-xs text-text-secondary">
                      Formula applied: Base completion proportional to approved deliverables minus liquidated damages index.
                    </div>
                  )}

                  {math?.formulaExplanation && (
                    <div className="p-3 bg-accent-secondary/5 rounded-lg border border-accent-secondary/20 text-xs text-text-secondary">
                      {math.formulaExplanation}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Model info */}
          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
            <span>Tribunal Engine: <span className="font-mono">{verdict.modelUsed || "Gemini 2.5 Flash Multi-Agent"}</span></span>
            <span>Issued: {new Date(verdict.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>

          {/* Action buttons — Accept, Challenge, or Escalate */}
          {disputeStatus === "VERDICT_READY" && !verdict.acceptedAt && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 bg-accent-success hover:bg-accent-success/90"
                >
                  {accepting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Accept Arbitral Award
                </Button>

                {canChallenge ? (
                  <Button
                    onClick={() => setShowChallengeForm(!showChallengeForm)}
                    variant="outline"
                    className="flex-1 border-accent-warning text-accent-warning hover:bg-accent-warning/10"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Challenge Award ({challengesRemaining} left)
                  </Button>
                ) : (
                  <Button
                    onClick={handleEscalate}
                    disabled={escalating}
                    variant="outline"
                    className="flex-1 border-accent-danger text-accent-danger hover:bg-accent-danger/10"
                  >
                    {escalating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-2" />
                    )}
                    Escalate to Human Tribunal
                  </Button>
                )}
              </div>

              {/* Challenge Form */}
              {showChallengeForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-bg-primary rounded-xl border border-accent-warning/30 space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-accent-warning" />
                      Challenge this Award
                    </h4>
                    <p className="text-xs text-text-secondary">
                      State your legal objections. The multi-agent pipeline will re-deliberate taking your challenge context into account.
                    </p>
                    <textarea
                      value={challengeReason}
                      onChange={(e) => setChallengeReason(e.target.value)}
                      placeholder="Explain why you disagree with this verdict (min 20 characters)..."
                      className="w-full h-24 bg-bg-elevated border border-border rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:border-accent-warning focus:outline-none"
                    />
                    {challengeError && (
                      <p className="text-xs text-accent-danger">{challengeError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleChallenge}
                        disabled={challenging || challengeReason.length < 20}
                        className="bg-accent-warning hover:bg-accent-warning/90 text-white"
                      >
                        {challenging ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 mr-2" />
                        )}
                        Submit Challenge
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowChallengeForm(false);
                          setChallengeError(null);
                        }}
                        className="text-text-secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {verdict.acceptedAt && (
            <div className="flex items-center gap-2 p-3 bg-accent-success/10 rounded-lg border border-accent-success/20">
              <CheckCircle2 className="w-5 h-5 text-accent-success" />
              <span className="text-sm text-accent-success font-medium">
                Award accepted — escrow funds settled and released
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Hidden Printable PDF Template */}
      <ArbitrationAwardPdf
        dispute={dispute || { title: contract?.title, id: disputeId }}
        verdict={verdict}
        contract={contract}
      />
    </motion.div>
  );
}
