"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Scale,
  ArrowLeft,
  User,
  FileText,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Gavel,
  Brain,
  ShieldAlert,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-accent-primary/20 text-accent-primary" },
  EVIDENCE_COLLECTION: { label: "Collecting Evidence", className: "bg-accent-secondary/20 text-accent-secondary" },
  AWAITING_AI: { label: "Awaiting AI", className: "bg-accent-primary/20 text-accent-primary" },
  AI_ANALYZING: { label: "AI Analyzing", className: "bg-accent-warning/20 text-accent-warning" },
  VERDICT_READY: { label: "Verdict Ready", className: "bg-accent-success/20 text-accent-success" },
  CHALLENGED: { label: "Challenged", className: "bg-accent-warning/20 text-accent-warning" },
  ESCALATED: { label: "Escalated", className: "bg-accent-danger/20 text-accent-danger" },
  RESOLVED: { label: "Resolved", className: "bg-text-secondary/20 text-text-secondary" },
};

export default function AdminDisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Resolution form state
  const [freelancerPercent, setFreelancerPercent] = useState(50);
  const [reasoning, setReasoning] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  const clientPercent = 100 - freelancerPercent;

  const fetchDispute = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/disputes/${id}`);
      setDispute(data.data);
    } catch (error) {
      console.error("Failed to fetch dispute:", error);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (dbUser && dbUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchDispute();
  }, [fetchDispute, dbUser, router]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/admin/disputes/${id}/analyze`);
      await fetchDispute();
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolve = async () => {
    if (reasoning.length < 10) {
      setResolveError("Please provide reasoning (at least 10 characters).");
      return;
    }

    setResolving(true);
    setResolveError(null);
    try {
      await api.post(`/admin/disputes/${id}/resolve`, {
        clientRefundPercent: clientPercent,
        freelancerReleasePercent: freelancerPercent,
        reasoning,
      });
      setResolveSuccess(true);
      await fetchDispute();
    } catch (err: any) {
      setResolveError(
        err.response?.data?.error || "Failed to resolve dispute"
      );
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <Card className="glass-elevated p-12 rounded-xl border-border text-center">
        <p className="text-text-secondary">Dispute not found</p>
      </Card>
    );
  }

  const escrowAmount = dispute.contract?.escrowWallet?.heldAmount ?? 0;
  const isResolved = dispute.status === "RESOLVED";
  const canResolve = !isResolved && dispute.status !== "AI_ANALYZING";
  const canAnalyze = dispute.freelancerStatement && ["OPEN", "EVIDENCE_COLLECTION", "AWAITING_AI", "CHALLENGED", "ESCALATED"].includes(dispute.status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        className="text-text-secondary hover:text-text-primary"
        onClick={() => router.push("/admin/disputes")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Disputes
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">
              {dispute.title}
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Admin Review — Contract: {dispute.contract?.title}
            </p>
          </div>
        </div>
        <Badge
          className={
            statusConfig[dispute.status]?.className || ""
          }
        >
          {statusConfig[dispute.status]?.label || dispute.status}
        </Badge>
      </div>

      {/* Challenge Alert — Show when dispute has been challenged */}
      {dispute.status === "CHALLENGED" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-elevated p-6 rounded-xl border-2 border-accent-warning/40">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-accent-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display font-semibold text-accent-warning mb-1">
                  Verdict Challenged
                </h3>
                <p className="text-text-secondary text-sm mb-3">
                  A party has challenged the AI verdict. Please re-analyze the dispute or resolve it manually.
                </p>

                {dispute.challengeReason && (
                  <div className="p-3 bg-bg-primary rounded-lg border border-border mb-3">
                    <p className="text-xs text-text-secondary mb-1">Challenge Reason:</p>
                    <p className="text-sm text-text-primary">&ldquo;{dispute.challengeReason}&rdquo;</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span>Challenge #{dispute.challengeCount} of 2</span>
                  {dispute.challengeCount >= 2 && (
                    <span className="text-accent-danger font-medium">
                      Max challenges reached — manual resolution recommended
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Contract Info */}
      <Card className="glass-elevated p-6 rounded-xl border-border">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Contract Details
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-secondary">Client</p>
            <p className="text-sm font-medium flex items-center gap-1 mt-1">
              <User className="w-3.5 h-3.5 text-accent-primary" />
              {dispute.contract?.client?.name}
            </p>
            <p className="text-xs text-text-secondary">
              {dispute.contract?.client?.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Freelancer</p>
            <p className="text-sm font-medium flex items-center gap-1 mt-1">
              <User className="w-3.5 h-3.5 text-accent-secondary" />
              {dispute.contract?.freelancer?.name}
            </p>
            <p className="text-xs text-text-secondary">
              {dispute.contract?.freelancer?.email}
            </p>
          </div>
          <div className="col-span-2 md:col-span-4 lg:col-span-2 grid grid-cols-2 gap-4 mt-2 lg:mt-0 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-4">
            <div>
              <p className="text-xs text-text-secondary">Readiness Status</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  {dispute.clientReady ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-success" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-text-secondary" />
                  )}
                  <span className={`text-xs ${dispute.clientReady ? "text-accent-success" : "text-text-secondary"}`}>
                    Client: {dispute.clientReady ? "Ready" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dispute.freelancerReady ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-success" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-text-secondary" />
                  )}
                  <span className={`text-xs ${dispute.freelancerReady ? "text-accent-success" : "text-text-secondary"}`}>
                    Freelancer: {dispute.freelancerReady ? "Ready" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Escrow Held</p>
              <p className="text-sm font-medium flex items-center gap-1 mt-1">
                <IndianRupee className="w-3.5 h-3.5 text-accent-warning" />₹
                {escrowAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Total: ₹{dispute.contract?.totalAmount?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Milestones */}
      {dispute.contract?.milestones?.length > 0 && (
        <Card className="glass-elevated p-6 rounded-xl border-border">
          <h3 className="font-display font-semibold mb-4">Milestones</h3>
          <div className="space-y-3">
            {dispute.contract.milestones.map((m: any, idx: number) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg border border-border"
              >
                <span className="text-xs font-mono text-text-secondary w-6">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-text-secondary">
                    ₹{m.amount?.toLocaleString("en-IN")} • Due{" "}
                    {format(new Date(m.dueDate), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge
                  className={
                    m.status === "COMPLETED"
                      ? "bg-accent-success/20 text-accent-success"
                      : m.status === "IN_PROGRESS"
                      ? "bg-accent-warning/20 text-accent-warning"
                      : "bg-bg-elevated text-text-secondary"
                  }
                >
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statements */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass-elevated p-6 rounded-xl border-border">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent-primary" />
            <h3 className="font-display font-semibold">
              Client&apos;s Statement
            </h3>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">
            &ldquo;{dispute.clientStatement}&rdquo;
          </p>
          <p className="text-xs text-text-secondary mt-3">
            — {dispute.contract?.client?.name}
          </p>
        </Card>

        <Card className="glass-elevated p-6 rounded-xl border-border">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent-secondary" />
            <h3 className="font-display font-semibold">
              Freelancer&apos;s Response
            </h3>
          </div>
          {dispute.freelancerStatement ? (
            <>
              <p className="text-text-secondary text-sm leading-relaxed">
                &ldquo;{dispute.freelancerStatement}&rdquo;
              </p>
              <p className="text-xs text-text-secondary mt-3">
                — {dispute.contract?.freelancer?.name}
              </p>
            </>
          ) : (
            <p className="text-text-secondary text-sm italic">
              No response submitted.
            </p>
          )}
        </Card>
      </div>

      {/* Evidence */}
      <Card className="glass-elevated p-6 rounded-xl border-border">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Evidence ({dispute.evidence?.length || 0})
        </h3>
        {dispute.evidence && dispute.evidence.length > 0 ? (
          <div className="grid gap-3">
            {dispute.evidence.map((ev: any) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg border border-border"
              >
                <FileText className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {ev.fileName}
                  </p>
                  <p className="text-xs text-text-secondary">
                    by {ev.uploadedBy?.name} • {ev.fileType}
                    {ev.description && ` • ${ev.description}`}
                  </p>
                </div>
                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-primary hover:underline"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-sm">
            No evidence was submitted.
          </p>
        )}
      </Card>

      {/* AI Analysis Trigger — Admin Only */}
      {canAnalyze && !dispute.verdict && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass-elevated p-8 rounded-xl border-border text-center glow-primary">
            <Brain className="w-12 h-12 text-accent-primary mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              {dispute.status === "CHALLENGED"
                ? "Re-Analyze After Challenge"
                : "Run AI Analysis"}
            </h3>
            <p className="text-text-secondary mb-6">
              {dispute.status === "CHALLENGED"
                ? `The previous verdict was challenged (challenge #${dispute.challengeCount}). Run AI analysis again, considering the challenge feedback.`
                : "Both parties have submitted their statements. Trigger AI mediation to analyze the dispute and generate a verdict."}
            </p>
            {dispute.challengeCount > 0 && dispute.challengeReason && (
              <div className="p-3 bg-bg-primary rounded-lg border border-border mb-4 text-left max-w-lg mx-auto">
                <p className="text-xs text-text-secondary mb-1">Latest challenge reason:</p>
                <p className="text-sm text-text-primary">&ldquo;{dispute.challengeReason}&rdquo;</p>
              </div>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              size="lg"
              className="bg-accent-primary hover:bg-accent-primary/90"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  {dispute.status === "CHALLENGED" ? "Re-Analyze Dispute" : "Run AI Analysis"}
                </>
              )}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* AI Analyzing Status */}
      {dispute.status === "AI_ANALYZING" && (
        <Card className="glass-elevated p-8 rounded-xl border-accent-warning/30 text-center">
          <Brain className="w-10 h-10 text-accent-warning mx-auto mb-3 animate-pulse" />
          <h3 className="font-display text-lg font-bold mb-1">AI Analysis in Progress</h3>
          <p className="text-text-secondary text-sm">
            The AI mediation engine is analyzing all statements and evidence. This may take a moment...
          </p>
        </Card>
      )}

      {/* Existing AI Verdict (if any) */}
      {dispute.verdict && (
        <Card className="glass-elevated p-6 rounded-xl border-border">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4 text-accent-primary" />
            AI Verdict {dispute.challengeCount > 0 ? `(Re-analysis #${dispute.challengeCount})` : "(for reference)"}
          </h3>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-bg-primary rounded-lg border border-border">
                <p className="text-xs text-text-secondary mb-1">
                  Client Refund
                </p>
                <p className="font-mono font-semibold text-accent-danger">
                  {dispute.verdict.clientRefundPercent}%
                </p>
              </div>
              <div className="p-3 bg-bg-primary rounded-lg border border-border">
                <p className="text-xs text-text-secondary mb-1">
                  Freelancer Release
                </p>
                <p className="font-mono font-semibold text-accent-success">
                  {dispute.verdict.freelancerReleasePercent}%
                </p>
              </div>
            </div>
            <div className="p-3 bg-bg-primary rounded-lg border border-border">
              <p className="text-xs text-text-secondary mb-1">AI Reasoning</p>
              <p className="text-sm text-text-primary leading-relaxed">
                {dispute.verdict.reasoning}
              </p>
            </div>
            <div className="p-3 bg-bg-primary rounded-lg border border-border">
              <p className="text-xs text-text-secondary mb-1">Contract Analysis</p>
              <p className="text-sm text-text-primary leading-relaxed">
                {dispute.verdict.contractAnalysis}
              </p>
            </div>
            <div className="p-3 bg-bg-primary rounded-lg border border-border">
              <p className="text-xs text-text-secondary mb-1">Evidence Summary</p>
              <p className="text-sm text-text-primary leading-relaxed">
                {dispute.verdict.evidenceSummary}
              </p>
            </div>
            {dispute.verdict.legalBasis && (
              <div className="p-3 bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 rounded-lg border border-accent-primary/20">
                <p className="text-xs text-accent-primary font-medium mb-1 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" /> Legal Provisions Applied
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {dispute.verdict.legalBasis}
                </p>
              </div>
            )}
            {dispute.verdict.escalatedToHuman && dispute.verdict.escalationReason && dispute.verdict.escalationReason !== "N/A" && (
              <div className="p-3 bg-accent-danger/5 rounded-lg border border-accent-danger/20">
                <p className="text-xs text-accent-danger font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Escalation Reason
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {dispute.verdict.escalationReason}
                </p>
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span>
                Confidence:{" "}
                <span className="font-mono">
                  {(dispute.verdict.confidenceScore * 100).toFixed(0)}%
                </span>
              </span>
              <span>
                Model:{" "}
                <span className="font-mono">
                  {dispute.verdict.modelUsed}
                </span>
              </span>
              {dispute.verdict.escalatedToHuman && (
                <span className="text-accent-danger font-medium">
                  ⚠ Flagged for human review
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Challenge History */}
      {dispute.challengeCount > 0 && (
        <Card className="glass-elevated p-6 rounded-xl border-border">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-warning" />
            Challenge History
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-bg-primary rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-accent-warning">
                  Challenge #{dispute.challengeCount}
                </span>
                <span className="text-xs text-text-secondary">
                  {dispute.challengeCount} / 2 used
                </span>
              </div>
              {dispute.challengeReason && (
                <p className="text-sm text-text-primary leading-relaxed">
                  &ldquo;{dispute.challengeReason}&rdquo;
                </p>
              )}
            </div>
            {dispute.challengeCount >= 2 && (
              <div className="p-3 bg-accent-danger/10 rounded-lg border border-accent-danger/20">
                <p className="text-sm text-accent-danger font-medium">
                  Maximum challenges reached. Manual resolution is recommended.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Admin Resolution Panel */}
      {canResolve && !resolveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="glass-elevated rounded-2xl border-2 border-accent-primary/20 overflow-hidden glow-primary">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Gavel className="w-6 h-6 text-accent-primary" />
                <h3 className="font-display text-xl font-bold">
                  Admin Resolution
                </h3>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                Manually distribute escrow funds and resolve this dispute
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Escrow Split Slider */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-3 block">
                  Escrow Distribution — ₹
                  {escrowAmount.toLocaleString("en-IN")}
                </label>

                {/* Visual split bar */}
                <div className="relative h-12 rounded-lg overflow-hidden bg-bg-primary border border-border mb-3">
                  <motion.div
                    animate={{
                      width: `${freelancerPercent}%`,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-success to-accent-success/70 flex items-center justify-center"
                  >
                    {freelancerPercent >= 15 && (
                      <span className="text-xs font-mono font-medium text-white">
                        Freelancer {freelancerPercent}%
                      </span>
                    )}
                  </motion.div>
                  <motion.div
                    animate={{
                      width: `${clientPercent}%`,
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-accent-danger to-accent-danger/70 flex items-center justify-center"
                  >
                    {clientPercent >= 15 && (
                      <span className="text-xs font-mono font-medium text-white">
                        Client {clientPercent}%
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={freelancerPercent}
                  onChange={(e) =>
                    setFreelancerPercent(parseInt(e.target.value))
                  }
                  className="w-full accent-accent-primary"
                />

                {/* Amount labels */}
                <div className="flex justify-between mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-accent-success" />
                    <User className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-text-secondary">Freelancer</span>
                    <span className="font-mono font-medium text-accent-success">
                      ₹
                      {(
                        (escrowAmount * freelancerPercent) /
                        100
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-accent-danger">
                      ₹
                      {((escrowAmount * clientPercent) / 100).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                    <span className="text-text-secondary">Client</span>
                    <User className="w-3.5 h-3.5 text-text-secondary" />
                    <div className="w-3 h-3 rounded bg-accent-danger" />
                  </div>
                </div>
              </div>

              {/* Reasoning Textarea */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Admin Reasoning
                </label>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Explain the reasoning behind this resolution decision..."
                  className="w-full h-32 bg-bg-primary border border-border rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:border-accent-primary focus:outline-none"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Minimum 10 characters. This will be recorded as the official
                  resolution reasoning.
                </p>
              </div>

              {/* Error */}
              {resolveError && (
                <div className="p-3 bg-accent-danger/10 rounded-lg border border-accent-danger/20">
                  <p className="text-sm text-accent-danger flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {resolveError}
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleResolve}
                disabled={resolving || reasoning.length < 10}
                size="lg"
                className="w-full bg-accent-primary hover:bg-accent-primary/90"
              >
                {resolving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4 mr-2" />
                    Resolve Dispute & Distribute Funds
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Success Message */}
      {(resolveSuccess || isResolved) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass-elevated p-8 rounded-xl border-accent-success/30 text-center glow-success">
            <CheckCircle2 className="w-12 h-12 text-accent-success mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              Dispute Resolved
            </h3>
            <p className="text-text-secondary">
              Escrow funds have been distributed and both parties have been
              notified.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
