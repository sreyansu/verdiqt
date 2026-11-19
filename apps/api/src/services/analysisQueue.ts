import { Dispute, Verdict, AnalysisRun } from "../models";
import { executeTribunalGraph } from "./tribunalGraph";
import { getIO } from "../lib/socket";
import { AI_CONFIG } from "../config/aiConfig";
import { createInAppNotification } from "./notificationService";

interface QueueJob {
  disputeId: string;
  disputeVersion: number;
  runId: string;
  retryCount: number;
}

class DisputeAnalysisQueue {
  private queue: QueueJob[] = [];
  private activeJobs = new Set<string>(); // Tracks disputeId currently processing
  private processing = false;

  /**
   * Enqueue a dispute for automated, idempotent tribunal analysis.
   * Concurrency-safe: ignores duplicate triggers if already queued or actively running for the same version.
   */
  public async enqueue(disputeId: string): Promise<{ queued: boolean; runId?: string; reason?: string }> {
    if (this.activeJobs.has(disputeId)) {
      return { queued: false, reason: "Analysis already in progress for this dispute" };
    }

    // Atomic fetch & lock of dispute state
    const dispute: any = await Dispute.findById(disputeId);
    if (!dispute) {
      return { queued: false, reason: "Dispute not found" };
    }

    if (!dispute.clientReady || !dispute.freelancerReady) {
      return { queued: false, reason: "Both parties must be marked ready before automated analysis can trigger." };
    }

    const version = dispute.version || 1;

    // Check if an analysis run already succeeded or is running for this version
    const existingRun = await AnalysisRun.findOne({
      disputeId: dispute._id,
      disputeVersion: version,
      status: { $in: ["IN_PROGRESS", "COMPLETED"] },
    });

    if (existingRun && existingRun.status === "COMPLETED" && dispute.status === "VERDICT_READY") {
      return { queued: false, reason: "Current dispute version already has a completed verdict." };
    }

    const runId = `RUN-${dispute._id}-${version}-${Date.now()}`;
    const threadId = `THREAD-${dispute._id}-${version}`;

    // Create AnalysisRun record in DB
    const newRun = await AnalysisRun.create({
      disputeId: dispute._id,
      disputeVersion: version,
      threadId,
      status: "PENDING",
      modelId: AI_CONFIG.primaryModel,
      promptVersion: AI_CONFIG.promptVersion,
      agentVersion: AI_CONFIG.agentVersion,
      rubricVersion: AI_CONFIG.rubricVersion,
      legalCorpusVersion: AI_CONFIG.legalCorpusVersion,
      readinessSnapshot: {
        clientReady: dispute.clientReady,
        freelancerReady: dispute.freelancerReady,
        timestamp: new Date(),
      },
      evidenceSnapshot: (dispute.evidence || []).map((e: any) => ({
        id: (e._id || e.id).toString(),
        fileName: e.fileName,
        sha256Hash: e.sha256Hash || null,
      })),
      retryCount: 0,
    });

    // Update dispute record to link active run
    await Dispute.findByIdAndUpdate(disputeId, {
      $set: {
        activeAnalysisRunId: newRun._id.toString(),
        status: "AWAITING_AI",
      },
      $push: {
        auditTrail: {
          action: "AUTOMATIC_ANALYSIS_QUEUED",
          timestamp: new Date(),
          details: { runId: newRun._id.toString(), version },
        },
      },
    });

    this.queue.push({
      disputeId,
      disputeVersion: version,
      runId: newRun._id.toString(),
      retryCount: 0,
    });

    // Trigger queue processing worker loop
    this.processNext();

    return { queued: true, runId: newRun._id.toString() };
  }

  /**
   * Internal queue worker loop.
   */
  private async processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift();
    if (!job) {
      this.processing = false;
      return;
    }

    this.activeJobs.add(job.disputeId);
    const io = getIO();

    try {
      // 1. Mark status AI_ANALYZING
      await Dispute.findByIdAndUpdate(job.disputeId, {
        $set: { status: "AI_ANALYZING" },
      });
      await AnalysisRun.findByIdAndUpdate(job.runId, {
        $set: { status: "IN_PROGRESS", startedAt: new Date() },
      });

      io.to(`dispute:${job.disputeId}`).emit("disputeStatusChange", {
        disputeId: job.disputeId,
        status: "AI_ANALYZING",
        message: "Automated LangGraph Tribunal initialized. Running multi-agent deliberation...",
      });

      // 2. Execute LangGraph DAG
      const graphResult = await executeTribunalGraph({
        disputeId: job.disputeId,
        analysisRunId: job.runId,
        disputeVersion: job.disputeVersion,
      });

      const finalVerdict = graphResult.finalVerdict;
      if (!finalVerdict) {
        throw new Error("Tribunal DAG completed without producing a valid final verdict.");
      }

      // 3. Persist Verdict to MongoDB
      // Remove any prior verdict for this dispute
      await Verdict.findOneAndDelete({ disputeId: job.disputeId });

      const savedVerdict = await Verdict.create({
        ...finalVerdict,
        analysisRunId: job.runId,
      });

      // 4. Update AnalysisRun
      await AnalysisRun.findByIdAndUpdate(job.runId, {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
          resultVerdictId: savedVerdict._id,
          graphCheckpoints: graphResult.checkpoints,
        },
      });

      // 5. Update Dispute status
      const nextStatus = finalVerdict.escalatedToHuman ? "ESCALATED" : "VERDICT_READY";
      await Dispute.findByIdAndUpdate(job.disputeId, {
        $set: { status: nextStatus },
        $push: {
          auditTrail: {
            action: nextStatus === "ESCALATED" ? "ANALYSIS_ESCALATED_TO_HUMAN" : "ANALYSIS_VERDICT_READY",
            timestamp: new Date(),
            details: {
              runId: job.runId,
              awardHash: finalVerdict.awardHash,
              confidenceScore: finalVerdict.confidenceScore,
            },
          },
        },
      });

      // 6. Broadcast Realtime Updates
      io.to(`dispute:${job.disputeId}`).emit("disputeStatusChange", {
        disputeId: job.disputeId,
        status: nextStatus,
        verdictId: savedVerdict._id.toString(),
      });

      // Notify dispute participants
      const dispute: any = await Dispute.findById(job.disputeId).populate("contract");
      if (dispute?.contract) {
        const title = nextStatus === "ESCALATED" ? "Tribunal Escalated to Human Review" : "AI Settlement Recommendation Ready";
        const message = nextStatus === "ESCALATED"
          ? `Dispute "${dispute.title}" requires human oversight due to high variance or unverified criteria.`
          : `Settlement recommendation generated for "${dispute.title}".`;

        if (dispute.contract.clientId) {
          createInAppNotification({
            recipientId: dispute.contract.clientId,
            type: "VERDICT_READY",
            title,
            message,
            relatedEntity: { entityType: "Dispute", entityId: job.disputeId },
            targetRoute: `/disputes/${job.disputeId}`,
          }).catch(console.error);
        }
        if (dispute.contract.freelancerId) {
          createInAppNotification({
            recipientId: dispute.contract.freelancerId,
            type: "VERDICT_READY",
            title,
            message,
            relatedEntity: { entityType: "Dispute", entityId: job.disputeId },
            targetRoute: `/disputes/${job.disputeId}`,
          }).catch(console.error);
        }
      }
    } catch (err: any) {
      console.error(`[AnalysisQueue] Job failed for dispute ${job.disputeId}:`, err);

      // Dead-letter / retry policy
      if (job.retryCount < 2) {
        console.warn(`[AnalysisQueue] Re-queuing job ${job.runId} (Attempt ${job.retryCount + 1})`);
        this.queue.push({
          ...job,
          retryCount: job.retryCount + 1,
        });
      } else {
        // Mark failed & escalate for human intervention
        await AnalysisRun.findByIdAndUpdate(job.runId, {
          $set: {
            status: "FAILED",
            completedAt: new Date(),
            errorDetails: err?.message || String(err),
          },
        });

        await Dispute.findByIdAndUpdate(job.disputeId, {
          $set: { status: "ESCALATED" },
          $push: {
            auditTrail: {
              action: "ANALYSIS_FAILED_ESCALATED",
              timestamp: new Date(),
              details: { error: err?.message || String(err) },
            },
          },
        });

        io.to(`dispute:${job.disputeId}`).emit("disputeStatusChange", {
          disputeId: job.disputeId,
          status: "ESCALATED",
          error: "Analysis encountered an unexpected condition and was escalated for human tribunal oversight.",
        });
      }
    } finally {
      this.activeJobs.delete(job.disputeId);
      this.processing = false;
      // Continue next job if any
      this.processNext();
    }
  }
}

export const analysisQueue = new DisputeAnalysisQueue();

