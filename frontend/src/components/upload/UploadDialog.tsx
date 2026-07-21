import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DocumentItem } from "@/types";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentItem[];
  onUpload: (files: FileList) => void;
}

const ACCEPTED = ".pdf,.docx,.txt,.md";

const STAGE_LABEL: Record<DocumentItem["status"], string> = {
  uploading: "Uploading",
  chunking: "Chunking",
  embedding: "Embedding",
  ready: "Ready",
  error: "Failed",
};

export function UploadDialog({ open, onOpenChange, documents, onUpload }: UploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files);
    },
    [onUpload]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            PDF, DOCX, TXT, or Markdown. Files are chunked and embedded automatically.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-slate-50 py-8 text-center transition-colors",
            dragActive && "border-primary bg-primary-light"
          )}
        >
          <UploadCloud className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">Drag files here, or click to browse</p>
          <p className="text-xs text-muted">Max 25MB per file</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => e.target.files && onUpload(e.target.files)}
          />
        </div>

        {documents.length > 0 && (
          <div className="mt-4 flex max-h-52 flex-col gap-1.5 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{doc.name}</span>
                {doc.status === "ready" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : doc.status === "error" ? (
                  <X className="h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
                )}
                <span className="w-16 shrink-0 text-right text-[11px] text-muted">
                  {STAGE_LABEL[doc.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
