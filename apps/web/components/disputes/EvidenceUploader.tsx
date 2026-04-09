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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
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
    maxFiles: 1,
    maxSize: MAX_EVIDENCE_FILE_SIZE,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("disputeId", disputeId);
      formData.append("description", description);

      await api.post("/evidence/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFile(null);
      setDescription("");
      onUpload();
    } catch (error: any) {
      console.error("Upload failed:", error);
      setFileError(error.response?.data?.error || "Unable to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? "border-accent-primary bg-accent-primary/5"
              : "border-border hover:border-accent-primary/50 hover:bg-bg-primary"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">
            {isDragActive
              ? "Drop your file here..."
              : "Drag & drop evidence files, or click to browse"}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            PDF, Images, DOC, TXT — Max 50MB
          </p>
        </div>
        {fileError ? (
          <p className="text-xs text-red-500 mt-2">{fileError}</p>
        ) : null}
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg border border-border">
            <FileText className="w-5 h-5 text-accent-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-secondary">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 rounded hover:bg-bg-elevated transition-colors"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this evidence..."
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-primary focus:outline-none"
          />

          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-accent-primary hover:bg-accent-primary/90"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Evidence
          </Button>
        </div>
      )}
    </div>
  );
}
