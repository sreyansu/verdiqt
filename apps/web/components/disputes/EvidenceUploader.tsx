"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthenticatedApi } from "@/lib/useAuthenticatedApi";

interface EvidenceUploaderProps {
  disputeId: string;
  onUpload: () => void;
}

const MAX_EVIDENCE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function EvidenceUploader({ disputeId, onUpload }: EvidenceUploaderProps) {
  const api = useAuthenticatedApi();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFiles((prev) => {
        const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
        const newAdditions = acceptedFiles.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
        return [...prev, ...newAdditions];
      });
      setFileError(null);
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const messages = fileRejections.flatMap(({ errors, file }) =>
      errors.map((error) => {
        if (error.code === "file-too-large") {
          return `File ${file.name} is too large. Maximum size is 50MB.`;
        }
        if (error.code === "file-invalid-type") {
          return `File ${file.name} has an unsupported type.`;
        }
        return `Unable to upload ${file.name}: ${error.message}`;
      })
    );
    setFileError(messages.join(" "));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 15,
    maxSize: MAX_EVIDENCE_FILE_SIZE,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("disputeId", disputeId);
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      await api.post("/evidence/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFiles([]);
      setDescription("");
      onUpload();
    } catch (error: any) {
      console.error("Upload failed:", error);
      setFileError(error.response?.data?.error || "Unable to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const formattedTotalSize =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(totalBytes / 1024).toFixed(0)} KB`;

  return (
    <div className="space-y-3">
      {selectedFiles.length === 0 ? (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-accent-primary bg-accent-primary/5"
                : "border-border hover:border-accent-primary/50 hover:bg-bg-primary"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-accent-primary mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary">
              {isDragActive
                ? "Drop your evidence files here..."
                : "Upload Contested Deliverables & Digital Evidence"}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Select one or multiple files (PDFs, Images, Code logs, DOCs) • Max 50MB per file
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary/10 rounded-full border border-accent-primary/20 text-[10px] text-accent-primary font-medium">
              <span>⚖️ Indian Evidence Act / BSA 2023 Section 65B Compliant Audit Trail</span>
            </div>
          </div>
          {fileError ? (
            <p className="text-xs text-red-500 mt-2">{fileError}</p>
          ) : null}
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-text-primary">
              {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} staged ({formattedTotalSize})
            </span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-text-secondary hover:text-rose-500 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}_${idx}`}
                className="flex items-center gap-3 p-2.5 bg-bg-primary rounded-lg border border-border text-xs"
              >
                <FileText className="w-4 h-4 text-accent-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-[11px] text-text-secondary">
                    {file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(file.size / 1024).toFixed(0)} KB`}{" "}
                    • Ready for parallel Cloudinary upload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded hover:bg-bg-elevated hover:text-rose-500 text-text-secondary transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add more files dropzone strip */}
          <div
            {...getRootProps()}
            className="border border-dashed border-border hover:border-accent-primary/60 rounded-lg p-2.5 text-center cursor-pointer bg-bg-primary/50 hover:bg-accent-primary/5 transition-colors"
          >
            <input {...getInputProps()} />
            <p className="text-xs text-text-secondary hover:text-accent-primary flex items-center justify-center gap-1.5 font-medium">
              <Upload className="w-3.5 h-3.5" />
              <span>+ Click or drag to add more evidence files</span>
            </p>
          </div>

          {fileError ? <p className="text-xs text-red-500 mt-1">{fileError}</p> : null}

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Evidence purpose: e.g., 'Screenshots and git diffs showing milestone completion'..."
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
          />

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-accent-primary hover:bg-accent-primary/90 font-medium text-xs h-9"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload {selectedFiles.length} Evidence {selectedFiles.length === 1 ? "File" : "Files"} Concurrently
          </Button>
        </div>
      )}
    </div>
  );
}
