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
  ListChecks,
  HelpCircle,
  XCircle,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [technicalTab, setTechnicalTab] = useState<"FORENSICS" | "MULTI_AGENT" | "MATH" | "HASH">("FORENSICS");

  const [accepting, setAccepting] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challenging, setChallenging] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  // Human Review Modal State
  const [showHumanReviewForm, setShowHumanReviewForm] = useState(false);
  const [humanReviewType, setHumanReviewType] = useState<"FULL" | "TECHNICAL" | "EVIDENCE" | "LEGAL">("FULL");
  const [humanReviewReason, setHumanReviewReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [humanReviewError, setHumanReviewError] = useState<string | null>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Data Extraction from Structured Report & Verdict
  const report = verdict.structuredReport;
  const valuation = verdict.valuationResult || verdict.quantumMeruitCalculation;
  const escrowAmount = contract?.escrowWallet?.heldAmount || contract?.totalAmount || 0;

  const hasFinancialRecommendation = report?.recommendation
    ? report.recommendation.financialRecommendationStatus === "RECOMMENDED"
    : Boolean(valuation?.hasFinancialRecommendation ?? (verdict.freelancerReleasePercent > 0 || verdict.clientRefundPercent > 0));

  const freelancerPercent = verdict.freelancerReleasePercent || 0;
  const clientPercent = verdict.clientRefundPercent || 0;
  const freelancerAmount = (escrowAmount * freelancerPercent) / 100;
  const clientRefundAmount = (escrowAmount * clientPercent) / 100;

  const canChallenge = disputeStatus === "VERDICT_READY" && !verdict.acceptedAt && challengeCount < 2;
  const challengesRemaining = 2 - challengeCount;

  // 8 Report Sections with Clean Fallbacks
  const caseSummary = report?.caseSummary || {
    projectName: contract?.title || "Contract Scope",
    clientName: contract?.client?.name || "Client",
    freelancerName: contract?.freelancer?.name || "Freelancer",
    disputedMilestoneTitle: dispute?.title || "Disputed Milestone",
    disputedMilestoneAmount: escrowAmount,
    disputedEscrowAmount: escrowAmount,
    currency: contract?.currency || "INR",
  };

  const tribunalAssessment = report?.tribunalAssessment || verdict.reasoning || "Tribunal evaluation completed based on submitted evidence.";
  const establishedFacts = report?.whatWasEstablished || [];
  const uncertainties = report?.whatRemainsUncertain || [];
  const criteria = report?.contractualRequirements || verdict.criterionAssessments || [];
  const recommendation = report?.recommendation || {
    type: hasFinancialRecommendation ? "SETTLEMENT_ALLOCATION" : "HOLD_IN_ESCROW_FOR_REVISION",
    financialRecommendationStatus: hasFinancialRecommendation ? "RECOMMENDED" : "NO_FINANCIAL_RECOMMENDATION",
    conciseSummary: hasFinancialRecommendation
      ? `Allocate ${freelancerPercent}% to freelancer and refund ${clientPercent}% to client.`
      : "Milestone funds remain held in escrow pending verification of core functionality.",
    justification: verdict.contractAnalysis || "Assessment completed under contractual acceptance criteria.",
  };
  const nextSteps = report?.nextSteps || [];
  const limitations = report?.limitations || {
    isAdvisory: true,
    disclaimerText: "Verdiqt arbitral findings are AI-assisted settlement recommendations formulated under principles of the Indian Arbitration and Conciliation Act, 1996 § 31 and Indian Contract Act, 1872. They are advisory and do not constitute an automatically binding legal award until formally accepted by both parties or confirmed by a designated human arbitral tribunal.",
    simulatedEscrowNote: "All wallet and escrow operations in this prototype are simulated for demonstration purposes.",
    governingPrinciples: "Bharatiya Sakshya Adhiniyam 2023 § 63, Indian Contract Act 1872 § 70 & § 73.",
  };

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

  const handleChallenge = async () => {
    if (challengeReason.length < 20) {
      setChallengeError("Challenge reason must be at least 20 characters.");
      return;
    }
    setChallenging(true);
    setChallengeError(null);
    try {
      await api.patch(`/disputes/${disputeId}/challenge`, { challengeReason });
      setChallengeReason("");
      setShowChallengeForm(false);
      onUpdate();
    } catch (error: any) {
      setChallengeError(error.response?.data?.error || "Failed to submit challenge");
    } finally {
      setChallenging(false);
    }
  };

  const handleRequestHumanReview = async () => {
    if (humanReviewReason.length < 20) {
      setHumanReviewError("Please provide a detailed reason (minimum 20 characters) for requesting human review.");
      return;
    }
    setSubmittingReview(true);
    setHumanReviewError(null);
    try {
      await api.post(`/disputes/${disputeId}/human-review`, {
        reviewType: humanReviewType,
        requestReason: humanReviewReason,
      });
      setHumanReviewReason("");
      setShowHumanReviewForm(false);
      onUpdate();
    } catch (error: any) {
      setHumanReviewError(error.response?.data?.error || "Failed to submit human review request");
    } finally {
      setSubmittingReview(false);
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
      pdf.save(`verdiqt-tribunal-report-${disputeId.slice(-6)}.pdf`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED_MET":
        return {
          label: "Verified Met",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "PARTIALLY_MET_WITH_DEFECTS":
        return {
          label: "Partially Met (Defects)",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />,
          classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "UNVERIFIED":
        return {
          label: "Unverified (Evidence Missing)",
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
          classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "NOT_MET":
        return {
          label: "Not Met",
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          classes: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      default:
        return {
          label: status,
          icon: <Info className="w-3.5 h-3.5 text-text-secondary" />,
          classes: "bg-bg-elevated text-text-secondary border-border",
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <Card className="glass-elevated rounded-2xl border-border overflow-hidden shadow-2xl">
        {/* ─── Top Header Bar ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-accent-primary/10 via-bg-elevated to-accent-secondary/10 px-5 sm:px-7 py-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-accent-primary/15 border border-accent-primary/30 text-accent-primary shadow-sm">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-text-primary">
                    Tribunal Dispute Resolution Report
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent-primary/15 text-accent-primary border border-accent-primary/30">
                    ODR Advisory
                  </span>
                  {verdict.escalatedToHuman && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Human Review Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Independent assessment formulated under Indian Arbitration &amp; Conciliation Act 1996 § 31 principles
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAwardPdf}
                disabled={downloadingPdf}
                className="border-border hover:border-accent-primary/40 hover:bg-accent-primary/10 text-xs font-medium"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Download Report PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          {/* ─── SECTION A: CASE SUMMARY ────────────────────────────────────── */}
          <div className="rounded-xl bg-bg-primary border border-border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent-primary" /> Case Summary
              </span>
              <span className="text-xs text-text-secondary font-mono">
                Dispute #{disputeId.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-text-secondary block text-[11px]">Project</span>
                <strong className="text-text-primary text-sm font-semibold truncate block mt-0.5">
                  {caseSummary.projectName}
                </strong>
              </div>
              <div>
                <span className="text-text-secondary block text-[11px]">Disputed Milestone</span>
                <strong className="text-text-primary text-sm font-semibold truncate block mt-0.5">
                  {caseSummary.disputedMilestoneTitle}
                </strong>
              </div>
              <div>
                <span className="text-text-secondary block text-[11px]">Parties</span>
                <div className="text-text-primary truncate font-medium mt-0.5">
                  {caseSummary.clientName} <span className="text-text-secondary font-normal">vs.</span> {caseSummary.freelancerName}
                </div>
              </div>
              <div>
                <span className="text-text-secondary block text-[11px]">Disputed Escrow</span>
                <strong className="text-accent-primary text-sm font-bold block mt-0.5 font-mono">
                  ₹{Number(caseSummary.disputedEscrowAmount).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </div>

          {/* ─── SECTION B: TRIBUNAL'S ASSESSMENT (100–150 Words) ─────────── */}
          <div className="rounded-xl bg-gradient-to-br from-bg-primary via-bg-elevated to-bg-primary border border-border p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2.5">
              <Gavel className="w-4 h-4 text-accent-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Tribunal&apos;s Assessment
              </h4>
            </div>
            <p className="text-sm sm:text-[15px] leading-relaxed text-text-primary font-normal">
              {tribunalAssessment}
            </p>
          </div>

          {/* ─── SECTION F: RECOMMENDATION & ALLOCATION ─────────────────────── */}
          <div className="rounded-xl bg-bg-primary border border-border p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-primary" /> Primary Recommendation
                </h4>
                <p className="text-sm font-bold text-text-primary mt-1">
                  {recommendation.conciseSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    hasFinancialRecommendation
                      ? "bg-accent-success/10 text-accent-success border-accent-success/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {hasFinancialRecommendation ? "Supported Split" : "Funds Held In Escrow"}
                </span>
              </div>
            </div>

            {/* Split Visualizer if Financial Recommendation is Supported */}
            {hasFinancialRecommendation ? (
              <div className="space-y-3 pt-1">
                <div className="relative h-10 rounded-lg overflow-hidden bg-bg-elevated border border-border flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freelancerPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center"
                  >
                    {freelancerPercent >= 15 && (
                      <span className="text-xs font-mono font-bold text-white px-2 truncate">
                        Freelancer {freelancerPercent}%
                      </span>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clientPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-l from-rose-500 to-rose-600 flex items-center justify-center"
                  >
                    {clientPercent >= 15 && (
                      <span className="text-xs font-mono font-bold text-white px-2 truncate">
                        Client {clientPercent}%
                      </span>
                    )}
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-text-secondary">Release to Freelancer:</span>
                    <strong className="font-mono text-emerald-400 font-bold">
                      ₹{freelancerAmount.toLocaleString("en-IN")} ({freelancerPercent}%)
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-text-secondary">Refund to Client:</span>
                    <strong className="font-mono text-rose-400 font-bold">
                      ₹{clientRefundAmount.toLocaleString("en-IN")} ({clientPercent}%)
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <strong className="text-amber-300 font-semibold block text-sm">
                    No Speculative Financial Split Awarded
                  </strong>
                  <p className="text-amber-200/90 leading-relaxed">
                    Under Verdiqt Financial Safeguards, milestone funds (₹{Number(caseSummary.disputedEscrowAmount).toLocaleString("en-IN")}) remain secured in escrow. Because core functional deliverables remain unverified from the submitted static files, no arbitrary percentage is fabricated. Resolution requires exchange of runnable source code or independent human tribunal review.
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-text-secondary leading-relaxed pt-1">
              <strong className="text-text-primary font-medium">Justification: </strong>
              {recommendation.justification}
            </p>
          </div>

          {/* ─── SECTION C & D: WHAT WAS ESTABLISHED VS WHAT REMAINS UNCERTAIN ─ */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* C: What Was Established */}
            <div className="rounded-xl bg-bg-primary border border-border p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  What Was Established
                </h4>
              </div>

              {establishedFacts.length > 0 ? (
                <div className="space-y-2.5">
                  {establishedFacts.map((fact: any) => (
                    <div key={fact.id} className="p-3 rounded-lg bg-bg-elevated/70 border border-border/60 text-xs space-y-1.5">
                      <p className="text-text-primary leading-relaxed">
                        {fact.statement}
                      </p>
                      {fact.evidenceReferences && fact.evidenceReferences.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-text-secondary">Evidence:</span>
                          {fact.evidenceReferences.map((ref: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic">
                  Initial prototype submission commenced as agreed under the contract schedule.
                </p>
              )}
            </div>

            {/* D: What Remains Uncertain */}
            <div className="rounded-xl bg-bg-primary border border-border p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  What Remains Uncertain
                </h4>
              </div>

              {uncertainties.length > 0 ? (
                <div className="space-y-2.5">
                  {uncertainties.map((item: any) => (
                    <div key={item.id} className="p-3 rounded-lg bg-bg-elevated/70 border border-border/60 text-xs space-y-1.5">
                      <div className="text-text-primary font-medium leading-relaxed">
                        {item.issue}
                      </div>
                      {item.impact && (
                        <p className="text-[11px] text-text-secondary">
                          <strong className="text-text-secondary">Impact:</strong> {item.impact}
                        </p>
                      )}
                      {item.missingEvidence && item.missingEvidence.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-amber-400/90 font-medium">Missing:</span>
                          {item.missingEvidence.map((ev: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic">
                  No material evidentiary uncertainties identified.
                </p>
              )}
            </div>
          </div>

          {/* ─── SECTION E: CONTRACTUAL REQUIREMENTS TABLE ─────────────────── */}
          <div className="rounded-xl bg-bg-primary border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-accent-primary" /> Contractual Requirements &amp; Verification Status
              </span>
              <span className="text-xs font-medium text-text-secondary">
                {criteria.length} evaluated criteria
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-bg-elevated/60 text-text-secondary border-b border-border font-medium">
                    <th className="py-2.5 px-4">Requirement / Criterion</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4">Explanation &amp; Evidence Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {criteria.map((ca: any, index: number) => {
                    const badge = getStatusBadge(ca.status);
                    return (
                      <tr key={ca.criterionId || index} className="hover:bg-bg-elevated/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-text-primary align-top max-w-[240px]">
                          <div>{ca.description}</div>
                          <span className="text-[10px] font-mono text-text-secondary block mt-0.5">
                            {ca.criterionId}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-text-secondary align-top whitespace-nowrap">
                          {ca.contractualWeight ? `${ca.contractualWeight}%` : "—"}
                        </td>
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${badge.classes}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary align-top space-y-1">
                          <p className="text-text-primary text-[11px] leading-relaxed">
                            {ca.conciseExplanation || ca.reasoning}
                          </p>
                          {ca.uncertaintyReason && (
                            <p className="text-[10px] text-amber-400/90 font-normal">
                              <strong>Uncertainty:</strong> {ca.uncertaintyReason}
                            </p>
                          )}
                          {ca.supportingEvidenceIds && ca.supportingEvidenceIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {ca.supportingEvidenceIds.map((eid: string) => (
                                <span
                                  key={eid}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-bg-elevated text-text-secondary border border-border"
                                >
                                  Ref #{eid.slice(-4)}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── SECTION G: ACTIONABLE NEXT STEPS ───────────────────────────── */}
          <div className="rounded-xl bg-bg-primary border border-border p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <Clock className="w-4 h-4 text-accent-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Actionable Next Steps
              </h4>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5">
              {nextSteps.map((step: any, idx: number) => {
                const isClient = step.targetParty === "CLIENT";
                const isFreelancer = step.targetParty === "FREELANCER";
                const borderClass = isClient
                  ? "border-blue-500/30 bg-blue-500/5"
                  : isFreelancer
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5";
                const badgeColor = isClient
                  ? "text-blue-400 bg-blue-500/10"
                  : isFreelancer
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-amber-400 bg-amber-500/10";

                return (
                  <div key={idx} className={`p-3.5 rounded-xl border ${borderClass} space-y-2 text-xs flex flex-col justify-between`}>
                    <div className="space-y-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeColor} inline-block`}>
                        {step.targetParty}
                      </span>
                      <p className="text-text-primary font-medium leading-relaxed">
                        {step.action}
                      </p>
                    </div>
                    {step.purpose && (
                      <p className="text-[11px] text-text-secondary border-t border-border/40 pt-1.5">
                        <span className="font-semibold text-text-secondary">Purpose:</span> {step.purpose}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── SECTION H: STATUTORY LIMITATIONS & ADVISORY NOTICE ─────────── */}
          <div className="p-4 rounded-xl bg-bg-elevated/50 border border-border text-xs text-text-secondary space-y-1.5">
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <Info className="w-4 h-4 text-accent-primary flex-shrink-0" />
              <span>Advisory Notice &amp; Governing Principles</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {limitations.disclaimerText}
            </p>
            <p className="leading-relaxed text-[10px] text-text-secondary/80">
              <strong>Governing Standards:</strong> {limitations.governingPrinciples} | {limitations.simulatedEscrowNote}
            </p>
          </div>

          {/* ─── ACTION BUTTONS (Accept / Challenge / Human Review) ──────────── */}
          {!verdict.acceptedAt && (
            <div className="pt-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {hasFinancialRecommendation && (
                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="flex-1 bg-accent-success hover:bg-accent-success/90 text-white font-semibold"
                  >
                    {accepting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Accept Settlement Recommendation
                  </Button>
                )}

                {canChallenge && (
                  <Button
                    onClick={() => {
                      setShowChallengeForm(!showChallengeForm);
                      setShowHumanReviewForm(false);
                    }}
                    variant="outline"
                    className="flex-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-semibold"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Challenge Findings ({challengesRemaining} remaining)
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setShowHumanReviewForm(!showHumanReviewForm);
                    setShowChallengeForm(false);
                  }}
                  variant="outline"
                  className="flex-1 border-accent-primary/50 text-accent-primary hover:bg-accent-primary/10 font-semibold"
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Request Independent Human Review
                </Button>
              </div>

              {/* Challenge Form Modal/Collapse */}
              {showChallengeForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-bg-primary rounded-xl border border-amber-500/40 space-y-3"
                >
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-text-primary">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Submit Objection to Findings
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Specify which factual findings or contractual criteria you dispute. Provide objective references for re-evaluation.
                  </p>
                  <textarea
                    value={challengeReason}
                    onChange={(e) => setChallengeReason(e.target.value)}
                    placeholder="Describe specific factual errors or evidence misapplications (minimum 20 characters)..."
                    className="w-full h-24 bg-bg-elevated border border-border rounded-lg p-3 text-xs text-text-primary placeholder:text-text-secondary resize-none focus:border-amber-500 focus:outline-none"
                  />
                  {challengeError && <p className="text-xs text-rose-400">{challengeError}</p>}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleChallenge}
                      disabled={challenging || challengeReason.length < 20}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                    >
                      {challenging ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                      Submit Challenge
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChallengeForm(false)}
                      className="text-xs text-text-secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Human Review Form Modal/Collapse */}
              {showHumanReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-bg-primary rounded-xl border border-accent-primary/40 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-accent-primary" />
                    <h4 className="text-sm font-bold text-text-primary">
                      Request Human Arbitral Review
                    </h4>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Escalate this case to an independent human legal or technical arbitrator. Escrow actions remain frozen during human review.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "FULL", label: "Full Review" },
                      { id: "TECHNICAL", label: "Technical / Code" },
                      { id: "EVIDENCE", label: "Forensic Evidence" },
                      { id: "LEGAL", label: "Statutory Law" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setHumanReviewType(type.id as any)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          humanReviewType === type.id
                            ? "bg-accent-primary text-white border-accent-primary shadow-sm"
                            : "bg-bg-elevated text-text-secondary border-border hover:border-text-secondary"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={humanReviewReason}
                    onChange={(e) => setHumanReviewReason(e.target.value)}
                    placeholder="Explain the specific technical gap or evidentiary dispute requiring human arbitrator evaluation (minimum 20 characters)..."
                    className="w-full h-24 bg-bg-elevated border border-border rounded-lg p-3 text-xs text-text-primary placeholder:text-text-secondary resize-none focus:border-accent-primary focus:outline-none"
                  />

                  {humanReviewError && <p className="text-xs text-rose-400">{humanReviewError}</p>}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRequestHumanReview}
                      disabled={submittingReview || humanReviewReason.length < 20}
                      className="bg-accent-primary hover:bg-accent-primary/90 text-white text-xs"
                    >
                      {submittingReview ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                      Confirm Escalation
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHumanReviewForm(false)}
                      className="text-xs text-text-secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {verdict.acceptedAt && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/25">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-300 font-medium">
                Award accepted — simulated escrow settled according to arbitral determination.
              </span>
            </div>
          )}

          {/* ─── EXPANDABLE TECHNICAL, FORENSIC & LEGAL DETAILS ─────────────── */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-elevated/40 hover:bg-bg-elevated/80 border border-border/80 transition-all text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent-primary" />
                <span>Technical &amp; Audit Details (Forensics, Agent Findings &amp; Quantum Meruit Math)</span>
              </div>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTechnicalDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3.5 space-y-4"
              >
                {/* Technical Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-border pb-2.5">
                  {[
                    { id: "FORENSICS", label: "Forensic Evidence", icon: <FileCheck2 className="w-3.5 h-3.5" /> },
                    { id: "MULTI_AGENT", label: "Agent Findings", icon: <Cpu className="w-3.5 h-3.5" /> },
                    { id: "MATH", label: "NS-QME Math Bounds", icon: <Calculator className="w-3.5 h-3.5" /> },
                    { id: "HASH", label: "Cryptographic Audit", icon: <Fingerprint className="w-3.5 h-3.5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTechnicalTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        technicalTab === tab.id
                          ? "bg-accent-primary text-white shadow-sm"
                          : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub-tab 1: Forensics */}
                {technicalTab === "FORENSICS" && (
                  <div className="p-4 rounded-xl bg-bg-primary border border-border text-xs space-y-3">
                    <h5 className="font-semibold text-text-primary flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-accent-primary" />
                      Digital Evidence Audit under BSA 2023 § 63
                    </h5>
                    <p className="text-text-secondary leading-relaxed">
                      {verdict.forensicAuditReport || "Forensic evaluation completed."}
                    </p>
                    <div className="p-3 rounded-lg bg-bg-elevated border border-border/60 text-[11px] text-text-secondary space-y-1">
                      <span className="font-semibold text-text-primary block">Important Forensic Distinction:</span>
                      A recorded SHA-256 hash confirms that a file is byte-for-byte identical to the uploaded artifact. It does not certify the operational truth or completeness of the contents.
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Agent Deliberations */}
                {technicalTab === "MULTI_AGENT" && (
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-bg-primary border border-border space-y-2">
                      <h5 className="font-semibold text-text-primary flex items-center gap-1.5 text-blue-400">
                        <User className="w-3.5 h-3.5" /> Client Advocate Submission
                      </h5>
                      <p className="text-text-secondary leading-relaxed">
                        {verdict.clientAdvocateReport || "No client advocate record."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-bg-primary border border-border space-y-2">
                      <h5 className="font-semibold text-text-primary flex items-center gap-1.5 text-emerald-400">
                        <User className="w-3.5 h-3.5" /> Freelancer Advocate Submission
                      </h5>
                      <p className="text-text-secondary leading-relaxed">
                        {verdict.freelancerDefenseReport || "No freelancer advocate record."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Math Bounds */}
                {technicalTab === "MATH" && (
                  <div className="p-4 rounded-xl bg-bg-primary border border-border text-xs space-y-3 font-mono">
                    <h5 className="font-semibold text-text-primary flex items-center gap-2 font-sans">
                      <Calculator className="w-4 h-4 text-accent-primary" />
                      Neuro-Symbolic Quantum Meruit (NS-QME) Breakdown
                    </h5>
                    {valuation?.calculationBreakdown ? (
                      <ul className="space-y-1.5 text-[11px] text-text-secondary">
                        {valuation.calculationBreakdown.map((line: string, i: number) => (
                          <li key={i} className="bg-bg-elevated/60 p-2 rounded border border-border/40">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary font-sans text-xs">
                        Valuation computed under deterministic rubric bounds.
                      </p>
                    )}
                  </div>
                )}

                {/* Sub-tab 4: Award Hash */}
                {technicalTab === "HASH" && (
                  <div className="p-4 rounded-xl bg-bg-primary border border-border text-xs space-y-2 font-mono">
                    <span className="text-text-secondary block font-sans text-xs">
                      Canonical SHA-256 Award Hash:
                    </span>
                    <div className="p-2.5 rounded bg-bg-elevated border border-border text-[11px] text-accent-primary break-all">
                      {verdict.awardHash || "SHA-256 Hash recorded in audit registry"}
                    </div>
                    <div className="text-[10px] text-text-secondary font-sans">
                      Model: {verdict.modelUsed || "Verdiqt LangGraph DAG NS-QME v2.1"} | Run ID: {verdict.analysisRunId || "RUN-LOCAL"}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
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
