"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  IndianRupee,
  Calendar,
  User,
  Loader2,
  Play,
  XCircle,
  Download,
  Scale,
} from "lucide-react";
import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { format } from "date-fns";
import { ProfessionalContractPdf } from "./ProfessionalContractPdf";

const milestoneStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-text-secondary/20 text-text-secondary" },
  SUBMITTED: { label: "Submitted", className: "bg-accent-primary/20 text-accent-primary" },
  APPROVED: { label: "Approved", className: "bg-accent-success/20 text-accent-success" },
  REJECTED: { label: "Rejected", className: "bg-accent-danger/20 text-accent-danger" },
  DISPUTED: { label: "Disputed", className: "bg-accent-warning/20 text-accent-warning" },
};

export default function ContractDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const api = useAuthenticatedApi();
  const { dbUser } = useUserStore();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [submitWorkDialogOpen, setSubmitWorkDialogOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<FileList | null>(null);
  const [submissionFileError, setSubmissionFileError] = useState<string | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);

  const MAX_SUBMISSION_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ACCEPTED_SUBMISSION_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const validateSubmissionFiles = (files: FileList | null) => {
    if (!files) {
      setSubmissionFileError(null);
      return true;
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_SUBMISSION_FILE_SIZE) {
        setSubmissionFileError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || "";
      const supportedExtensions = [
        "jpeg",
        "jpg",
        "png",
        "gif",
        "webp",
        "pdf",
        "txt",
        "doc",
        "docx",
      ];

      if (
        !ACCEPTED_SUBMISSION_TYPES.includes(file.type) &&
        !supportedExtensions.includes(extension)
      ) {
        setSubmissionFileError(`File ${file.name} has an unsupported file type.`);
        return false;
      }
    }

    setSubmissionFileError(null);
    return true;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("professional-pdf-template");
    if (!element) return;

    setDownloadingPdf(true);

    const originalStyles = {
      display: element.style.display,
      opacity: element.style.opacity,
      visibility: element.style.visibility,
      position: element.style.position,
      zIndex: element.style.zIndex,
    };

    try {
      element.style.display = "block";
      element.style.opacity = "1";
      element.style.visibility = "visible";
      element.style.position = "relative";
      element.style.zIndex = "1000";

      await new Promise(requestAnimationFrame);

      const canvas = await toCanvas(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = Math.floor(pdfHeight * pxPerMm);

      let remainingHeight = canvas.height;
      let offsetY = 0;
      let pageIndex = 0;

      while (remainingHeight > 0) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(remainingHeight, pageHeightPx);

        const ctx = pageCanvas.getContext("2d");
        if (!ctx) throw new Error("Unable to get canvas context");

        ctx.drawImage(canvas, 0, offsetY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

        const pageDataUrl = pageCanvas.toDataURL("image/png");
        const pageHeightMm = pageCanvas.height / pxPerMm;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(pageDataUrl, "PNG", 0, 0, pdfWidth, pageHeightMm);

        offsetY += pageCanvas.height;
        remainingHeight -= pageCanvas.height;
        pageIndex += 1;
      }

      pdf.save(`verdiqt-contract-${contract.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Unable to generate PDF. Please try again.");
    } finally {
      element.style.display = originalStyles.display;
      element.style.opacity = originalStyles.opacity;
      element.style.visibility = originalStyles.visibility;
      element.style.position = originalStyles.position;
      element.style.zIndex = originalStyles.zIndex;
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get(`/contracts/${id}`);
        setContract(data.data);
      } catch (error) {
        console.error("Failed to fetch contract:", error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [api, id]);

  const handleStatusChange = async (status: string) => {
    try {
      const { data } = await api.patch(`/contracts/${id}/status`, { status });
      setContract(data.data);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update status");
    }
  };

  const handleMilestoneAction = async (milestoneId: string, status: string) => {
    try {
      await api.patch(`/milestones/${milestoneId}`, { status });
      // Refresh entire contract to get updated escrow wallet and milestone statuses
      const { data } = await api.get(`/contracts/${id}`);
      setContract(data.data);
    } catch (error: any) {
      console.error("Milestone update error:", error);
      alert(error.response?.data?.error || "Failed to update milestone status");
    }
  };

  const openSubmitWorkDialog = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setSubmissionNote("");
    setSubmissionFiles(null);
    setSubmissionFileError(null);
    setSubmitWorkDialogOpen(true);
  };

  const handleSubmitWork = async () => {
    if (!selectedMilestoneId) return;

    if (!submissionNote.trim() && !submissionFiles?.length) {
      alert("Please add a work summary or upload files before submitting.");
      return;
    }

    if (!validateSubmissionFiles(submissionFiles)) {
      alert(submissionFileError || "Please fix file upload issues before submitting.");
      return;
    }

    setSubmittingWork(true);
    try {
      const formData = new FormData();
      formData.append("submissionNote", submissionNote);
      if (submissionFiles?.length) {
        Array.from(submissionFiles).forEach((file) => formData.append("files", file));
      }

      await api.post(`/milestones/${selectedMilestoneId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data } = await api.get(`/contracts/${id}`);
      setContract(data.data);
      setSubmitWorkDialogOpen(false);
    } catch (error: any) {
      console.error("Milestone submission failed:", error);
      alert(error.response?.data?.error || "Failed to submit work. Please try again.");
    } finally {
      setSubmittingWork(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (!contract) return <p className="text-text-secondary">Contract not found</p>;

  const isClient = contract.clientId === dbUser?.id;

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" className="text-text-secondary" onClick={() => router.push("/contracts")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Web UI wrapper - Hidden during PDF Print */}
      <div id="contract-details" className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center flex-shrink-0 shadow-lg glow-primary">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-secondary">
                Verdiqt Contract
              </h1>
              <h2 className="text-lg font-semibold mt-1 text-text-primary">{contract.title}</h2>
              <p className="text-text-secondary mt-1 max-w-xl text-sm">{contract.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <Badge className="text-sm capitalize">{contract.status}</Badge>
            {contract.status !== "DRAFT" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="border-border text-text-primary hover:bg-bg-elevated"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
            )}
          </div>
        </div>

      {/* Info grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-elevated p-4 rounded-xl border-border">
          <IndianRupee className="w-4 h-4 text-text-secondary mb-1" />
          <p className="font-mono font-bold text-lg">₹{contract.totalAmount.toLocaleString("en-IN")}</p>
          <p className="text-xs text-text-secondary">Total Amount</p>
        </Card>
        <Card className="glass-elevated p-4 rounded-xl border-border">
          <Calendar className="w-4 h-4 text-text-secondary mb-1" />
          <p className="font-medium">{format(new Date(contract.startDate), "dd MMM yyyy")}</p>
          <p className="text-xs text-text-secondary">Start Date</p>
        </Card>
        <Card className="glass-elevated p-4 rounded-xl border-border flex flex-col justify-between">
          <div>
            <User className="w-4 h-4 text-text-secondary mb-1" />
            <p className="font-medium">{contract.client?.name}</p>
            <p className="text-xs text-text-secondary truncate">{contract.client?.email}</p>
          </div>
          <Badge className="mt-3 w-fit bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-[10px] uppercase">Client</Badge>
        </Card>
        <Card className="glass-elevated p-4 rounded-xl border-border flex flex-col justify-between">
          <div>
            <User className="w-4 h-4 text-text-secondary mb-1" />
            <p className="font-medium">{contract.freelancer?.name}</p>
            <p className="text-xs text-text-secondary truncate">{contract.freelancer?.email}</p>
          </div>
          <Badge className="mt-3 w-fit bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 text-[10px] uppercase">Freelancer</Badge>
        </Card>
      </div>

      {/* Escrow */}
      {contract.escrowWallet && (
        <Card className="glass-elevated p-5 rounded-xl border-border glow-primary">
          <h3 className="font-display font-semibold mb-3">Escrow Vault</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-mono text-lg font-bold text-accent-warning">
                ₹{contract.escrowWallet.heldAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-text-secondary">Held</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-accent-success">
                ₹{contract.escrowWallet.releasedToFreelancer.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-text-secondary">Released</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-accent-danger">
                ₹{contract.escrowWallet.refundedToClient.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-text-secondary">Refunded</p>
            </div>
          </div>
        </Card>
      )}

      {/* Milestones */}
      <Card className="glass-elevated p-6 rounded-xl border-border">
        <h3 className="font-display font-semibold mb-4">Milestones</h3>
        <div className="space-y-3">
          {contract.milestones?.map((m: any, i: number) => {
            const status = milestoneStatusConfig[m.status] || milestoneStatusConfig.PENDING;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 bg-bg-primary rounded-lg border border-border"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  m.status === "APPROVED" ? "bg-accent-success" : "bg-bg-elevated border border-border"
                }`}>
                  {m.status === "APPROVED" ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Clock className="w-4 h-4 text-text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-text-secondary">{m.description}</p>
                </div>
                <span className="font-mono text-sm text-accent-primary">
                  ₹{m.amount.toLocaleString("en-IN")}
                </span>
                <Badge className={status.className}>{status.label}</Badge>

                {m.status === "SUBMITTED" && (m.submissionNote || m.submissionFiles?.length) && (
                  <div className="flex-1 min-w-0 mt-3 w-full rounded-lg border border-border bg-bg-secondary p-3">
                    {m.submissionNote && (
                      <p className="text-sm text-text-primary mb-2">{m.submissionNote}</p>
                    )}
                    {m.submissionFiles?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {m.submissionFiles.map((file: any) => (
                          <a
                            key={file.fileUrl}
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated"
                          >
                            {file.fileName}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary">No files attached.</p>
                    )}
                  </div>
                )}

                {/* Milestone Interaction UI (Phase 3) */}
                {contract.status === "ACTIVE" && (
                  <div className="flex gap-2 ml-4 pl-4 border-l border-border">
                    {/* Freelancer Action: Submit Work */}
                    {!isClient && (m.status === "PENDING" || m.status === "REJECTED") && (
                      <Dialog open={submitWorkDialogOpen} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedMilestoneId(null);
                          setSubmissionNote("");
                          setSubmissionFiles(null);
                        }
                        setSubmitWorkDialogOpen(open);
                      }}>
                        <DialogTrigger render={<Button size="sm" onClick={() => openSubmitWorkDialog(m.id)} className="h-8 text-xs bg-accent-primary hover:bg-accent-primary/90" />}>
                          Submit Work
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit milestone work</DialogTitle>
                            <DialogDescription>
                              Upload deliverables or add a summary before submitting this milestone for client review.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="submission-files">Files</Label>
                              <Input
                                id="submission-files"
                                type="file"
                                multiple
                                accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(event) => {
                                  const files = event.target.files;
                                  if (files) {
                                    if (validateSubmissionFiles(files)) {
                                      setSubmissionFiles(files);
                                    } else {
                                      setSubmissionFiles(null);
                                    }
                                  }
                                }}
                              />
                              {submissionFiles?.length ? (
                                <p className="mt-2 text-xs text-text-secondary">{submissionFiles.length} file(s) selected</p>
                              ) : (
                                <p className="mt-2 text-xs text-text-secondary">Attach files to share your work with the client.</p>
                              )}
                              <p className="mt-2 text-xs text-text-secondary">PDF, Images, DOC, TXT — Max 50MB per file</p>
                              {submissionFileError ? (
                                <p className="mt-2 text-xs text-red-500">{submissionFileError}</p>
                              ) : null}
                            </div>
                            <div>
                              <Label htmlFor="submission-note">Work summary</Label>
                              <Textarea
                                id="submission-note"
                                value={submissionNote}
                                onChange={(event) => setSubmissionNote(event.target.value)}
                                placeholder="Describe the work completed, attached files, or next steps..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSubmitWorkDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSubmitWork} disabled={submittingWork}>
                              {submittingWork ? "Submitting..." : "Submit Work"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Client Actions: Review Submission */}
                    {isClient && m.status === "SUBMITTED" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleMilestoneAction(m.id, "APPROVED")} className="h-8 text-xs bg-accent-success hover:bg-accent-success/90">
                          Approve & Pay
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMilestoneAction(m.id, "REJECTED")} className="h-8 text-xs text-accent-danger border-accent-danger hover:bg-accent-danger/10">
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
      </div>

      {/* Actions */}
      {/* Actions */}
      {contract.status === "DRAFT" && (
        <div className="flex gap-3 mt-4 print:hidden">
          {!isClient && (
            <Button onClick={() => handleStatusChange("ACTIVE")} className="bg-accent-success hover:bg-accent-success/90 glow-success shadow-lg">
              <Play className="w-4 h-4 mr-2" /> Accept & Activate Contract
            </Button>
          )}
          {isClient && (
            <Button onClick={() => handleStatusChange("CANCELLED")} variant="outline" className="border-accent-danger text-accent-danger">
              <XCircle className="w-4 h-4 mr-2" /> Cancel Draft
            </Button>
          )}
        </div>
      )}

      {/* Hidden Professional PDF Template rendering out-of-bounds */}
      <ProfessionalContractPdf contract={contract} />
    </div>
  );
}
