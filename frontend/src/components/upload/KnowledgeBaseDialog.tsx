import { FileText, CheckCircle2, Loader2, X, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { DocumentItem } from "@/types";

interface KnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentItem[];
}

export function KnowledgeBaseDialog({ open, onOpenChange, documents }: KnowledgeBaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Knowledge base</DialogTitle>
          <DialogDescription>Documents currently indexed for retrieval.</DialogDescription>
        </DialogHeader>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Database className="h-6 w-6 text-muted" />
            <p className="text-sm text-muted">No documents indexed yet</p>
          </div>
        ) : (
          <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{doc.name}</p>
                  <p className="text-[11px] text-muted">
                    {doc.type.toUpperCase()} · {doc.chunkCount ?? 0} chunks
                  </p>
                </div>
                {doc.status === "ready" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : doc.status === "error" ? (
                  <X className="h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
