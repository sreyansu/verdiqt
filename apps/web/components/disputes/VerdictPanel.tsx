"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  User,
  IndianRupee,
  Scale,
  Loader2,
  ShieldAlert,
  Gavel,
} from "lucide-react";
import ConfidenceMeter from "@/components/shared/ConfidenceMeter";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useState } from "react";

interface VerdictPanelProps {
  verdict: any;
  contract: any;
  onUpdate: () => void;
  disputeStatus: string;
  disputeId: string;
  challengeCount: number;
}

export default function VerdictPanel({
  verdict,
  contract,
  onUpdate,
  disputeStatus,
  disputeId,
  challengeCount,
}: VerdictPanelProps) {
  const api = useAuthenticatedApi();
  const [accepting, setAccepting] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeReason, setChallengeReason] = useState("");
  const [challenging, setChallenging] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  const escrowAmount = contract?.escrowWallet?.heldAmount || 0;
  const freelancerAmount = (escrowAmount * verdict.freelancerReleasePercent) / 100;
  const clientRefund = (escrowAmount * verdict.clientRefundPercent) / 100;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="glass-elevated rounded-2xl border-border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-accent-primary" />
            <h3 className="font-display text-xl font-bold">
              {disputeStatus === "RESOLVED" ? "Final Verdict" : "AI Verdict"}
            </h3>
            {verdict.escalatedToHuman && (
              <span className="ml-auto px-3 py-1 rounded-full bg-accent-danger/20 text-accent-danger text-xs font-medium">
                Escalated to Human Review
              </span>
            )}
            {challengeCount > 0 && (
              <span className="ml-auto px-3 py-1 rounded-full bg-accent-warning/20 text-accent-warning text-xs font-medium">
                Re-analyzed after challenge #{challengeCount}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Confidence + Fund Split Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Confidence Meter */}
            <div className="flex justify-center">
              <ConfidenceMeter score={verdict.confidenceScore} />
            </div>

            {/* Fund Split Bar */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium text-text-secondary mb-3">
                Escrow Split • ₹{escrowAmount.toLocaleString("en-IN")}
              </h4>

              {/* Visual bar */}
              <div className="relative h-10 rounded-lg overflow-hidden bg-bg-primary border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${verdict.freelancerReleasePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-success to-accent-success/70 flex items-center justify-center"
                >
                  {verdict.freelancerReleasePercent >= 20 && (
                    <span className="text-xs font-mono font-medium text-white">
                      {verdict.freelancerReleasePercent}%
                    </span>
                  )}
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${verdict.clientRefundPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-accent-danger to-accent-danger/70 flex items-center justify-center"
                >
                  {verdict.clientRefundPercent >= 20 && (
                    <span className="text-xs font-mono font-medium text-white">
                      {verdict.clientRefundPercent}%
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Split details */}
              <div className="flex justify-between mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-accent-success" />
                  <User className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="text-text-secondary">Freelancer</span>
                  <span className="font-mono font-medium text-accent-success">
                    ₹{freelancerAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-accent-danger">
                    ₹{clientRefund.toLocaleString("en-IN")}
                  </span>
                  <span className="text-text-secondary">Client</span>
                  <User className="w-3.5 h-3.5 text-text-secondary" />
                  <div className="w-3 h-3 rounded bg-accent-danger" />
                </div>
              </div>
            </div>
          </div>

          {/* Fault Split */}
          <div className="p-4 bg-bg-primary rounded-xl border border-border">
            <h4 className="text-sm font-medium text-text-secondary mb-2">Fault Assessment</h4>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                Client: <span className="font-mono font-semibold text-accent-danger">{verdict.clientFaultPercent}%</span>
              </span>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${verdict.freelancerFaultPercent}%` }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="h-full bg-accent-warning rounded-full"
                />
              </div>
              <span className="text-sm">
                Freelancer: <span className="font-mono font-semibold text-accent-warning">{verdict.freelancerFaultPercent}%</span>
              </span>
            </div>
          </div>

          {/* Legal Explanation Sections */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Gavel className="w-4 h-4" /> Legal Reasoning
              </h4>
              <p className="text-sm text-text-primary leading-relaxed bg-bg-primary rounded-lg p-4 border border-border">
                {verdict.reasoning}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" /> Contract Analysis
              </h4>
              <p className="text-sm text-text-primary leading-relaxed bg-bg-primary rounded-lg p-4 border border-border">
                {verdict.contractAnalysis}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">Evidence Summary</h4>
              <p className="text-sm text-text-primary leading-relaxed bg-bg-primary rounded-lg p-4 border border-border">
                {verdict.evidenceSummary}
              </p>
            </div>

            {verdict.legalBasis && (
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Legal Provisions Applied
                </h4>
                <p className="text-sm text-text-primary leading-relaxed bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 rounded-lg p-4 border border-accent-primary/20">
                  {verdict.legalBasis}
                </p>
              </div>
            )}

            {verdict.escalatedToHuman && verdict.escalationReason && verdict.escalationReason !== "N/A" && (
              <div>
                <h4 className="text-sm font-medium text-accent-danger mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Escalation Reason
                </h4>
                <p className="text-sm text-text-primary leading-relaxed bg-accent-danger/5 rounded-lg p-4 border border-accent-danger/20">
                  {verdict.escalationReason}
                </p>
              </div>
            )}
          </div>

          {/* Model info */}
          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
            <span>Model: <span className="font-mono">{verdict.modelUsed}</span></span>
            <span>Generated: {new Date(verdict.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons — Accept, Challenge, or Escalate */}
          {disputeStatus === "VERDICT_READY" && !verdict.acceptedAt && (
            <div className="space-y-4">
              {/* Primary Actions */}
              <div className="flex gap-3">
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
                  Accept Verdict
                </Button>

                {canChallenge ? (
                  <Button
                    onClick={() => setShowChallengeForm(!showChallengeForm)}
                    variant="outline"
                    className="flex-1 border-accent-warning text-accent-warning hover:bg-accent-warning/10"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Challenge Verdict ({challengesRemaining} left)
                  </Button>
                ) : challengeCount >= 2 ? (
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
                    Escalate to Human
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
                    Escalate to Human
                  </Button>
                )}
              </div>

              {/* Challenge count info */}
              {challengeCount > 0 && challengeCount < 2 && (
                <p className="text-xs text-text-secondary text-center">
                  This verdict was re-analyzed after a previous challenge. You have {challengesRemaining} challenge{challengesRemaining !== 1 ? "s" : ""} remaining.
                </p>
              )}

              {challengeCount >= 2 && (
                <div className="p-3 bg-accent-warning/10 rounded-lg border border-accent-warning/20 text-center">
                  <p className="text-sm text-accent-warning font-medium">
                    Maximum challenges reached — You may accept or escalate to a human administrator for final resolution.
                  </p>
                </div>
              )}

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
                      Challenge this Verdict
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Explain why you believe this verdict is incorrect. The dispute will be sent back to the administrator for re-analysis by the AI. You have {challengesRemaining} challenge{challengesRemaining !== 1 ? "s" : ""} remaining.
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
                Verdict accepted — escrow funds have been distributed
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
