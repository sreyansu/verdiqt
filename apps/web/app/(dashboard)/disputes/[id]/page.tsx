"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Scale,
  Brain,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  User,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useDisputeRealtime } from "@/hooks/useRealtime";
import { useUserStore } from "@/store/userStore";
import { format } from "date-fns";
import ConfidenceMeter from "@/components/shared/ConfidenceMeter";
import VerdictPanel from "@/components/disputes/VerdictPanel";
import EvidenceUploader from "@/components/disputes/EvidenceUploader";

const stageConfig: Record<string, { icon: any; color: string; label: string }> = {
  OPEN: { icon: Clock, color: "text-accent-primary", label: "Open" },
  EVIDENCE_COLLECTION: { icon: Upload, color: "text-accent-secondary", label: "Evidence Collection" },
  AI_ANALYZING: { icon: Brain, color: "text-accent-warning", label: "AI Analyzing" },
  VERDICT_READY: { icon: CheckCircle2, color: "text-accent-success", label: "Verdict Ready" },
  ESCALATED: { icon: AlertTriangle, color: "text-accent-danger", label: "Escalated" },
  RESOLVED: { icon: Scale, color: "text-text-secondary", label: "Resolved" },
};

const stages = ["OPEN", "EVIDENCE_COLLECTION", "AI_ANALYZING", "VERDICT_READY", "RESOLVED"];

export default function DisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [respondText, setRespondText] = useState("");
  const [responding, setResponding] = useState(false);

  const fetchDispute = useCallback(async () => {
    try {
      const { data } = await api.get(`/disputes/${id}`);
      setDispute(data.data);
    } catch (error) {
      console.error("Failed to fetch dispute:", error);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  // Realtime status updates
  useDisputeRealtime(id as string, (newStatus) => {
    setDispute((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
    if (newStatus === "VERDICT_READY") {
      fetchDispute(); // Refetch to get verdict data
    }
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/disputes/${id}/analyze`);
      await fetchDispute();
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRespond = async () => {
    setResponding(true);
    try {
      await api.patch(`/disputes/${id}/respond`, {
        freelancerStatement: respondText,
      });
      await fetchDispute();
      setRespondText("");
    } catch (error) {
      console.error("Response failed:", error);
    } finally {
      setResponding(false);
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

  const currentStageIndex = stages.indexOf(dispute.status);
  const isFreelancer = dispute.contract?.freelancerId === dbUser?.id;
  const canRespond = isFreelancer && !dispute.freelancerStatement && dispute.status === "OPEN";
  const canAnalyze = dispute.freelancerStatement && ["OPEN", "EVIDENCE_COLLECTION"].includes(dispute.status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        className="text-text-secondary hover:text-text-primary"
        onClick={() => router.push("/disputes")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Disputes
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{dispute.title}</h1>
          <p className="text-text-secondary mt-1">
            Contract: {dispute.contract?.title}
          </p>
        </div>
        <Badge className={stageConfig[dispute.status]?.color || ""}>
          {stageConfig[dispute.status]?.label}
        </Badge>
      </div>

      {/* Stage Timeline */}
      <Card className="glass-elevated p-6 rounded-xl border-border">
        <h3 className="font-display font-semibold mb-4">Dispute Progress</h3>
        <div className="flex items-center gap-2">
          {stages.map((stage, i) => {
            const isCompleted = i <= currentStageIndex;
            const isCurrent = stage === dispute.status;
            const config = stageConfig[stage];
            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: isCompleted ? "var(--accent-primary)" : "var(--bg-elevated)",
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      isCompleted ? "border-accent-primary" : "border-border"
                    } ${isCurrent ? "animate-pulse-ring" : ""}`}
                  >
                    <config.icon className={`w-4 h-4 ${isCompleted ? "text-white" : "text-text-secondary"}`} />
                  </motion.div>
                  <span className={`text-xs mt-2 text-center ${isCurrent ? "text-accent-primary font-medium" : "text-text-secondary"}`}>
                    {config.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 rounded ${
                      i < currentStageIndex ? "bg-accent-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Statements */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass-elevated p-6 rounded-xl border-border">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent-primary" />
            <h3 className="font-display font-semibold">Client&apos;s Statement</h3>
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
            <h3 className="font-display font-semibold">Freelancer&apos;s Response</h3>
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
          ) : canRespond ? (
            <div className="space-y-3">
              <textarea
                value={respondText}
                onChange={(e) => setRespondText(e.target.value)}
                placeholder="Write your response to this dispute..."
                className="w-full h-32 bg-bg-primary border border-border rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:border-accent-primary focus:outline-none"
              />
              <Button
                onClick={handleRespond}
                disabled={respondText.length < 20 || responding}
                className="bg-accent-secondary hover:bg-accent-secondary/90"
              >
                {responding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Response
              </Button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm italic">
              Awaiting freelancer&apos;s response...
            </p>
          )}
        </Card>
      </div>

      {/* Evidence */}
      <Card className="glass-elevated p-6 rounded-xl border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Evidence ({dispute.evidence?.length || 0})
          </h3>
        </div>

        {dispute.evidence && dispute.evidence.length > 0 && (
          <div className="grid gap-3 mb-4">
            {dispute.evidence.map((ev: any) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg border border-border"
              >
                <FileText className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.fileName}</p>
                  <p className="text-xs text-text-secondary">
                    by {ev.uploadedBy?.name} • {ev.fileType}
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
        )}

        {["OPEN", "EVIDENCE_COLLECTION"].includes(dispute.status) && (
          <EvidenceUploader disputeId={dispute.id} onUpload={fetchDispute} />
        )}
      </Card>

      {/* Analyze Button */}
      {canAnalyze && !dispute.verdict && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass-elevated p-8 rounded-xl border-border text-center glow-primary">
            <Brain className="w-12 h-12 text-accent-primary mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              Ready for AI Analysis
            </h3>
            <p className="text-text-secondary mb-6">
              Both parties have submitted their statements. Request AI mediation to
              analyze the dispute and generate a verdict.
            </p>
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
                  Request AI Analysis
                </>
              )}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Verdict Panel */}
      {dispute.verdict && (
        <VerdictPanel
          verdict={dispute.verdict}
          contract={dispute.contract}
          onAccept={fetchDispute}
          disputeStatus={dispute.status}
        />
      )}
    </div>
  );
}
