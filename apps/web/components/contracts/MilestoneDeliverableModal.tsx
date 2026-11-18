"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, AlertCircle, RefreshCw, Loader2, X, ExternalLink } from "lucide-react";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";

export interface DeliverableFile {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  publicId?: string;
  bytes?: number;
  uploadedAt?: string;
}

interface MilestoneDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  fileIndex: number;
  file: DeliverableFile | null;
}

export function MilestoneDeliverableModal({
  isOpen,
  onClose,
  milestoneId,
  fileIndex,
  file,
}: MilestoneDeliverableModalProps) {
  const api = useAuthenticatedApi();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isPdf =
    file?.fileType?.includes("pdf") ||
    file?.fileName?.toLowerCase().endsWith(".pdf") ||
    false;
  const isImage =
    file?.fileType?.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(file?.fileName || "") ||
    false;

  const loadFileBlob = async () => {
    if (!milestoneId || !file) return;
    setLoading(true);
    setError(null);

    try {
      // First try fetching authenticated preview from our backend
      const response = await api.get(`/milestones/${milestoneId}/files/${fileIndex}/preview`, {
        responseType: "blob",
      });

      const contentType = isPdf
        ? "application/pdf"
        : file.fileType || response.headers["content-type"] || "application/octet-stream";

      const blob = new Blob([response.data], {
        type: contentType,
      });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err: any) {
      console.warn("Backend preview endpoint failed, falling back to direct URL:", err);
      // Fallback: direct Cloudinary URL if available
      if (file.fileUrl) {
        setBlobUrl(file.fileUrl);
      } else {
        setError("Unable to load document preview. You can still download the original file below.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && file) {
      loadFileBlob();
    } else {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
      setBlobUrl(null);
      setError(null);
      setLoading(true);
    }
    return () => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, milestoneId, fileIndex]);

  const handleDownload = async () => {
    if (!file) return;
    setDownloading(true);
    try {
      const response = await api.get(`/milestones/${milestoneId}/files/${fileIndex}/download`, {
        responseType: "blob",
      });
      const contentType = isPdf
        ? "application/pdf"
        : file.fileType || response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const downloadLink = document.createElement("a");
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = file.fileName || "milestone_deliverable";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.warn("Download endpoint failed, triggering direct URL fallback:", err);
      if (file.fileUrl) {
        const link = document.createElement("a");
        link.href = file.fileUrl;
        link.target = "_blank";
        link.download = file.fileName;
        link.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col bg-white border border-border shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5 text-accent-primary" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-emerald-600" />
              ) : (
                <FileText className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-text-primary truncate">
                {file.fileName}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                {file.fileType || "Deliverable"}
                {file.bytes ? ` • ${(file.bytes / 1024).toFixed(1)} KB` : ""}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(blobUrl, "_blank")}
                className="text-xs gap-1.5 h-9 border-slate-200 hover:bg-slate-50"
                title="Open preview in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">New Tab</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-accent-primary hover:bg-accent-primary/90 text-white gap-2 cursor-pointer h-9 px-4"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-slate-900/5 relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
              <p className="text-sm font-medium">Securing and preparing document preview...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-8 max-w-md text-center bg-white border border-border rounded-2xl shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-sm">Preview Unavailable</h4>
                <p className="text-xs text-text-secondary mt-1">{error}</p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={loadFileBlob} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Preview
                </Button>
                <Button size="sm" onClick={handleDownload} className="bg-accent-primary text-white gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isPdf ? (
                <object
                  data={`${blobUrl}#toolbar=1&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full border-none"
                >
                  <iframe
                    src={`${blobUrl}#toolbar=1`}
                    title={file.fileName}
                    className="w-full h-full border-none"
                  >
                    <div className="p-8 text-center bg-white rounded-2xl shadow-xs space-y-3 m-4">
                      <p className="text-sm font-semibold text-slate-700">Preview not supported directly in this browser frame</p>
                      <p className="text-xs text-slate-500">You can download the deliverable or open it in a separate tab.</p>
                      <div className="flex gap-2 justify-center pt-2">
                        <Button size="sm" onClick={() => window.open(blobUrl, "_blank")} variant="outline" className="gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open in Tab
                        </Button>
                        <Button size="sm" onClick={handleDownload} className="bg-accent-primary text-white gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  </iframe>
                </object>
              ) : isImage ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blobUrl}
                    alt={file.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="p-8 max-w-md text-center bg-white border border-border rounded-2xl shadow-sm space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-base">{file.fileName}</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Direct in-browser preview is not supported for this file format. You can download and open it on your device.
                    </p>
                  </div>
                  <Button size="sm" onClick={handleDownload} className="bg-accent-primary text-white gap-2">
                    <Download className="w-4 h-4" />
                    Download File
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

