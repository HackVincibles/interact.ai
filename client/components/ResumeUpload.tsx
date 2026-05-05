"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { FileUp, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface ResumeUploadProps {
  userId: string;
  currentResumeName?: string;
  onUploadComplete: (url: string, name: string) => void;
}

export default function ResumeUpload({
  userId,
  currentResumeName,
  onUploadComplete,
}: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState(currentResumeName || "");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const actualFile = acceptedFiles[0];
      if (!actualFile) return;

      if (actualFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file.");
        return;
      }

      setIsUploading(true);
      setFileName(actualFile.name);

      const formData = new FormData();
      formData.append("resume", actualFile);
      formData.append("userId", userId);

      try {
        const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000/api';
        const response = await axios.post(`${API_URL}/upload/resume`, formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || actualFile.size)
            );
            setProgress(percentCompleted);
          },
        });

        if (response.data.success) {
          onUploadComplete(response.data.url, actualFile.name);
          toast.success("Resume uploaded successfully!");
        } else {
          throw new Error(response.data.message || "Upload failed");
        }
      } catch (error: any) {
        console.error("Upload failed:", error);
        toast.error(error.message || "Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${isUploading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading... {Math.round(progress)}%</p>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-full bg-primary/10">
              <FileUp className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {isDragActive ? "Drop your resume here" : "Upload your resume"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop or click to select (PDF only)
              </p>
            </div>
          </>
        )}
      </div>

      {fileName && !isUploading && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs px-2">
              {fileName}
            </span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setFileName("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
