"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  ExternalLink,
  FileText,
  Eye,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  X,
} from "lucide-react";
import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";
import { useUserStore } from "@/store/userStore";
import { format } from "date-fns";
import { auth } from "@/lib/firebase";
import { ProfessionalContractPdf } from "./ProfessionalContractPdf";
import { MilestoneDeliverableModal } from "@/components/contracts/MilestoneDeliverableModal";

const milestoneStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-text-secondary/20 text-text-secondary" },
  SUBMITTED: { label: "Submitted for Review", className: "bg-accent-primary/20 text-accent-primary" },
  APPROVED: { label: "Approved & Paid", className: "bg-accent-success/20 text-accent-success" },
  REJECTED: { label: "Revision Requested", className: "bg-rose-100 text-rose-700 border border-rose-200" },
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
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submissionFileError, setSubmissionFileError] = useState<string | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingMilestoneId, setRejectingMilestoneId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [expandedHistoryMilestoneIds, setExpandedHistoryMilestoneIds] = useState<Set<string>>(new Set());
  const [previewFileModal, setPreviewFileModal] = useState<{
    open: boolean;
    milestoneId: string;
    fileIndex: number;
    file: any;
  } | null>(null);

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

  const validateSubmissionFiles = (files: File[] | FileList | null): boolean => {
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

  const handleAddSubmissionFiles = (newFiles: FileList | File[] | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const filesArray = Array.from(newFiles);
    if (!validateSubmissionFiles(filesArray)) return;

    setSubmissionFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const newItems = filesArray.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
      return [...prev, ...newItems];
    });
  };

  const handleRemoveSubmissionFile = (indexToRemove: number) => {
    setSubmissionFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
      element.style.left = originalStyles.left;
      element.style.top = originalStyles.top;
      setDownloadingPdf(false);
    }
  };

  const handleOpenDeliverableInNewTab = async (
    milestoneId: string,
    fileIndex: number,
    file: any
  ) => {
    // Open new tab immediately in the user-gesture click handler to bypass popup blockers
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      newWindow.document.title = file.fileName || "Verdiqt Deliverable Preview";
      newWindow.document.body.innerHTML = `
        <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;">
          <div style="width:36px;height:36px;border:3px solid #334155;border-top-color:#38bdf8;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:16px;"></div>
          <p style="font-size:14px;font-weight:600;margin:0 0 6px 0;">Securing & opening deliverable preview...</p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">${file.fileName || ""}</p>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </div>
      `;
    }

    try {
      let token: string | null = null;
      if (auth?.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const targetUrl = token
        ? `${apiBase}/api/milestones/${milestoneId}/files/${fileIndex}/preview?token=${encodeURIComponent(token)}`
        : `${apiBase}/api/milestones/${milestoneId}/files/${fileIndex}/preview`;

      if (newWindow) {
        newWindow.location.href = targetUrl;
      } else {
        window.open(targetUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to load deliverable preview URL:", err);
      if (newWindow) {
        newWindow.location.href = file.fileUrl || "about:blank";
      }
    }
  };

  const handleDownloadDeliverable = async (
    milestoneId: string,
    fileIndex: number,
    file: any
  ) => {
    try {
      let token: string | null = null;
      if (auth?.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const downloadUrl = token
        ? `${apiBase}/api/milestones/${milestoneId}/files/${fileIndex}/download?token=${encodeURIComponent(token)}`
        : `${apiBase}/api/milestones/${milestoneId}/files/${fileIndex}/download`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.fileName || "milestone_deliverable";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download deliverable:", err);
      if (file.fileUrl) {
        window.open(file.fileUrl, "_blank");
      }
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

  const handleMilestoneAction = async (milestoneId: string, status: string, reason?: string) => {
    try {
      await api.patch(`/milestones/${milestoneId}`, {
        status,
        rejectionReason: reason,
      });
      // Refresh entire contract to get updated escrow wallet and milestone statuses
      const { data } = await api.get(`/contracts/${id}`);
      setContract(data.data);
    } catch (error: any) {
      console.error("Milestone update error:", error);
      alert(error.response?.data?.error || "Failed to update milestone status");
    }
  };

  const openRejectDialog = (milestoneId: string) => {
    setRejectingMilestoneId(milestoneId);
    setRejectionReasonInput("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingMilestoneId) return;
    setRejecting(true);
    try {
      await handleMilestoneAction(rejectingMilestoneId, "REJECTED", rejectionReasonInput.trim());
      setRejectDialogOpen(false);
      setRejectingMilestoneId(null);
      setRejectionReasonInput("");
    } finally {
      setRejecting(false);
    }
  };

  const toggleHistoryExpanded = (milestoneId: string) => {
    setExpandedHistoryMilestoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) next.delete(milestoneId);
      else next.add(milestoneId);
      return next;
    });
  };

  const openSubmitWorkDialog = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setSubmissionNote("");
    setSubmissionFiles([]);
    setSubmissionFileError(null);
    setSubmitWorkDialogOpen(true);
  };

  const handleSubmitWork = async () => {
    if (!selectedMilestoneId) return;

    if (!submissionNote.trim() && submissionFiles.length === 0) {
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
      submissionFiles.forEach((file) => formData.append("files", file));

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
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg glow-primary">
              <Image
                src="/verdiqt-icon.png"
                alt="Verdiqt Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
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
            <div className="flex items-center gap-2">
              <Badge className="text-sm capitalize">{contract.status}</Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/messages?contractId=${contract.id || contract._id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-text-primary hover:bg-bg-elevated gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-accent-primary" />
                  <span>Messages</span>
                </Button>
              </Link>
              {contract.status !== "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="border-border text-text-primary hover:bg-bg-elevated cursor-pointer"
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
        </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex items-center justify-between mb-1">
              <User className="w-4 h-4 text-text-secondary" />
              {contract.clientId && (
                <Link
                  href={`/profile/${contract.clientId}`}
                  className="text-[11px] text-accent-primary hover:underline flex items-center gap-0.5"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
            <p className="font-semibold text-sm text-text-primary">{contract.client?.name}</p>
            {contract.client?.company && (
              <p className="text-xs text-accent-secondary font-medium truncate">{contract.client.company}</p>
            )}
            <p className="text-xs text-text-secondary truncate">{contract.client?.email}</p>
          </div>
          <Badge className="mt-3 w-fit bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-[10px] uppercase">Client</Badge>
        </Card>
        <Card className="glass-elevated p-4 rounded-xl border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <User className="w-4 h-4 text-text-secondary" />
              {contract.freelancerId && (
                <Link
                  href={`/profile/${contract.freelancerId}`}
                  className="text-[11px] text-accent-secondary hover:underline flex items-center gap-0.5"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>
            <p className="font-semibold text-sm text-text-primary">{contract.freelancer?.name}</p>
            {contract.freelancer?.professionalTitle && (
              <p className="text-xs text-accent-secondary font-medium truncate">{contract.freelancer.professionalTitle}</p>
            )}
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
        <div className="space-y-4">
          {contract.milestones?.map((m: any, i: number) => {
            const status = milestoneStatusConfig[m.status] || milestoneStatusConfig.PENDING;
            return (
              <motion.div
                key={m.id || m._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                  m.status === "REJECTED"
                    ? "bg-rose-50/30 border-rose-200/90 shadow-2xs"
                    : m.status === "APPROVED"
                    ? "bg-emerald-50/20 border-emerald-200/80"
                    : "bg-bg-primary border-border"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      m.status === "APPROVED"
                        ? "bg-accent-success/15 text-accent-success border border-accent-success/20"
                        : m.status === "REJECTED"
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-bg-elevated border border-border"
                    }`}>
                      {m.status === "APPROVED" ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-success" />
                      ) : m.status === "REJECTED" ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-text-secondary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text-primary">{m.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{m.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:self-center self-start flex-wrap">
                    <span className="font-mono text-sm font-semibold text-accent-primary">
                      ₹{m.amount.toLocaleString("en-IN")}
                    </span>
                    <Badge className={status.className}>{status.label}</Badge>

                    {/* Milestone Actions */}
                    {contract.status === "ACTIVE" && (
                      <div className="flex items-center gap-2">
                        {/* Freelancer Submit / Re-upload button */}
                        {!isClient && m.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => openSubmitWorkDialog(m.id || m._id)}
                            className="h-8 text-xs bg-accent-primary hover:bg-accent-primary/90 text-white gap-1.5 shadow-xs cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Submit Work</span>
                          </Button>
                        )}
                        {!isClient && m.status === "REJECTED" && (
                          <Button
                            size="sm"
                            onClick={() => openSubmitWorkDialog(m.id || m._id)}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-upload & Resubmit</span>
                          </Button>
                        )}

                        {/* Client Review actions */}
                        {isClient && m.status === "SUBMITTED" && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleMilestoneAction(m.id || m._id, "APPROVED")}
                              className="h-8 text-xs bg-accent-success hover:bg-accent-success/90 text-white gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Pay</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectDialog(m.id || m._id)}
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Request Changes</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection / Revision Requested Banner */}
                {m.status === "REJECTED" && (
                  <div className="p-3.5 bg-rose-50/90 border border-rose-200/90 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>Milestone Rejected — Revision Requested</span>
                      </div>
                      {!isClient && (
                        <span className="text-[11px] text-rose-700 font-medium">
                          Please review the feedback and submit revised work.
                        </span>
                      )}
                    </div>
                    {m.rejectionReason && (
                      <div className="bg-white p-2.5 rounded-lg border border-rose-100 text-rose-950 font-medium text-xs leading-relaxed">
                        <span className="text-rose-500 font-semibold text-[11px] block mb-0.5">Client Feedback:</span>
                        &ldquo;{m.rejectionReason}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* Submitted Work Deliverables (Active / Previous) */}
                {Boolean(m.submissionNote || (m.submissionFiles && m.submissionFiles.length > 0)) && (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-accent-primary" />
                        <span>{m.status === "REJECTED" ? "Previous Submitted Work" : "Submitted Work Deliverables"}</span>
                      </span>
                      {m.submittedAt && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {format(new Date(m.submittedAt), "MMM d, yyyy • h:mm a")}
                        </span>
                      )}
                    </div>

                    {m.submissionNote && (
                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                        {m.submissionNote}
                      </p>
                    )}

                    {m.submissionFiles?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {m.submissionFiles.map((file: any, fIdx: number) => (
                          <div
                            key={file.fileUrl || fIdx}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white pl-3 pr-2 py-1.5 text-xs font-medium text-text-primary hover:bg-slate-50 transition-colors shadow-2xs group"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenDeliverableInNewTab(m.id || m._id, fIdx, file)}
                              className="inline-flex items-center gap-2 cursor-pointer text-left"
                              title="Click to open preview in a new tab"
                            >
                              <FileText className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
                              <span className="truncate max-w-[200px] hover:text-accent-primary hover:underline">{file.fileName}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent-primary flex-shrink-0 ml-0.5" />
                            </button>
                            <span className="w-px h-3.5 bg-slate-200 mx-1" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDeliverable(m.id || m._id, fIdx, file);
                              }}
                              className="p-1 text-slate-400 hover:text-accent-primary hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Download deliverable file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submissions History Accordion (if previous revisions exist) */}
                {Array.isArray(m.submissionHistory) && m.submissionHistory.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleHistoryExpanded(m.id || m._id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 py-1 cursor-pointer transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Earlier Submissions History ({m.submissionHistory.length}{" "}
                        {m.submissionHistory.length === 1 ? "previous version" : "previous versions"})
                      </span>
                      {expandedHistoryMilestoneIds.has(m.id || m._id) ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedHistoryMilestoneIds.has(m.id || m._id) && (
                      <div className="mt-2.5 space-y-2.5 pl-3 border-l-2 border-slate-200">
                        {m.submissionHistory.map((hist: any, hIdx: number) => (
                          <div key={hIdx} className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                              <span className="font-semibold text-slate-700">Revision {hIdx + 1}</span>
                              {hist.submittedAt && (
                                <span>{format(new Date(hist.submittedAt), "MMM d, yyyy • h:mm a")}</span>
                              )}
                            </div>
                            {hist.submissionNote && (
                              <p className="text-slate-600 bg-slate-50 p-2 rounded-lg">{hist.submissionNote}</p>
                            )}
                            {hist.rejectionReason && (
                              <div className="text-[11px] text-rose-700 bg-rose-50/80 p-2 rounded-lg border border-rose-100">
                                <strong>Feedback given:</strong> &ldquo;{hist.rejectionReason}&rdquo;
                              </div>
                            )}
                            {hist.submissionFiles?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {hist.submissionFiles.map((hf: any, hfIdx: number) => (
                                  <a
                                    key={hfIdx}
                                    href={hf.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                                  >
                                    <FileText className="w-3 h-3 text-slate-500" />
                                    <span className="truncate max-w-[160px]">{hf.fileName}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
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

      {/* ── Submit / Re-upload Milestone Deliverables Modal ── */}
      {(() => {
        const activeMilestone = contract.milestones?.find(
          (m: any) => (m.id || m._id) === selectedMilestoneId
        );
        const isReupload = activeMilestone?.status === "REJECTED";

        return (
          <Dialog open={submitWorkDialogOpen} onOpenChange={setSubmitWorkDialogOpen}>
            <DialogContent className="max-w-lg bg-white rounded-3xl border border-border shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {isReupload ? (
                    <>
                      <RotateCcw className="w-5 h-5 text-rose-600" />
                      <span>Re-upload Deliverables & Resubmit</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5 text-accent-primary" />
                      <span>Submit Milestone Deliverables</span>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {isReupload
                    ? "Review the client's revision feedback and upload your updated deliverables. Previous submissions are preserved in history."
                    : "Upload deliverables or add a work summary before submitting this milestone for client review."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* If Reupload, show the client's rejection feedback & previous work */}
                {isReupload && activeMilestone && (
                  <div className="space-y-2">
                    {activeMilestone.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                        <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Client's Revision Feedback</span>
                        </span>
                        <p className="text-rose-950 font-medium bg-white/80 p-2 rounded-xl border border-rose-100">
                          &ldquo;{activeMilestone.rejectionReason}&rdquo;
                        </p>
                      </div>
                    )}

                    {activeMilestone.submissionFiles?.length > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                        <span className="font-semibold text-slate-700 block">Previously Submitted Files:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMilestone.submissionFiles.map((pf: any, pIdx: number) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleOpenDeliverableInNewTab(activeMilestone.id || activeMilestone._id, pIdx, pf)}
                              className="inline-flex items-center gap-1.5 text-[11px] bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Click to view file in new tab"
                            >
                              <FileText className="w-3 h-3 text-accent-primary" />
                              <span className="truncate max-w-[150px]">{pf.fileName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="submission-files" className="text-xs font-semibold text-slate-700">
                      {isReupload ? "Upload Revised Deliverables" : "Milestone Deliverable Files"}
                    </Label>
                    {submissionFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSubmissionFiles([])}
                        className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear all ({submissionFiles.length})
                      </button>
                    )}
                  </div>

                  {/* Staged files list with individual remove */}
                  {submissionFiles.length > 0 && (
                    <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto pr-1">
                      {submissionFiles.map((file, idx) => (
                        <div
                          key={`${file.name}_${idx}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <FileText className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-medium text-slate-800 truncate block max-w-[280px]">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {file.size > 1024 * 1024
                                  ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                  : `${(file.size / 1024).toFixed(0)} KB`}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubmissionFile(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Input
                    id="submission-files"
                    type="file"
                    multiple
                    accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => {
                      handleAddSubmissionFiles(event.target.files);
                      event.target.value = ""; // Reset so user can pick more files incrementally
                    }}
                    className="mt-1 text-xs cursor-pointer"
                  />
                  {submissionFiles.length > 0 ? (
                    <p className="mt-1.5 text-xs text-emerald-600 font-medium">
                      ✓ {submissionFiles.length} file(s) staged • Ready for parallel Cloudinary upload
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Select multiple files or add them one by one (PDF, Images, DOC, TXT) — Max 50MB per file
                    </p>
                  )}
                  {submissionFileError && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">{submissionFileError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="submission-note" className="text-xs font-semibold text-slate-700">
                    {isReupload ? "Revision Summary (Changes made)" : "Work Summary & Deliverable Notes"}
                  </Label>
                  <Textarea
                    id="submission-note"
                    rows={4}
                    value={submissionNote}
                    onChange={(event) => setSubmissionNote(event.target.value)}
                    placeholder={
                      isReupload
                        ? "Describe the revisions made, updated files, or addressing the client's feedback..."
                        : "Describe the deliverables completed, links, or instructions for the client..."
                    }
                    className="mt-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setSubmitWorkDialogOpen(false)} disabled={submittingWork}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitWork}
                  disabled={submittingWork}
                  className={`text-xs gap-1.5 text-white ${
                    isReupload ? "bg-rose-600 hover:bg-rose-700" : "bg-accent-primary hover:bg-accent-primary/90"
                  }`}
                >
                  {submittingWork ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isReupload ? (
                    <RotateCcw className="w-3.5 h-3.5" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {submittingWork
                      ? `Uploading ${submissionFiles.length > 0 ? `${submissionFiles.length} Deliverables & ` : ""}Submitting...`
                      : isReupload
                      ? submissionFiles.length > 0
                        ? `Submit Revised Work (${submissionFiles.length} files)`
                        : "Submit Revised Work"
                      : submissionFiles.length > 0
                      ? `Submit Work (${submissionFiles.length} files)`
                      : "Submit Work"}
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Client Reject / Request Revision Modal ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Request Milestone Revision</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Explain what adjustments or deliverables the freelancer needs to provide before this milestone can be approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="rejection-reason" className="text-xs font-semibold text-slate-700">
                Revision Feedback / Rejection Reason
              </Label>
              <Textarea
                id="rejection-reason"
                rows={4}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Please update the UI based on the feedback in chat and provide the responsive mobile mockups..."
                className="mt-1.5 text-xs text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The freelancer will receive your feedback and will be able to re-upload revised deliverables.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectDialogOpen(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReject}
              disabled={rejecting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
            >
              {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>Reject & Request Revision</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Milestone Deliverable Preview & Download Modal */}
      {previewFileModal && (
        <MilestoneDeliverableModal
          isOpen={previewFileModal.open}
          onClose={() => setPreviewFileModal(null)}
          milestoneId={previewFileModal.milestoneId}
          fileIndex={previewFileModal.fileIndex}
          file={previewFileModal.file}
        />
      )}
    </div>
  );
}
