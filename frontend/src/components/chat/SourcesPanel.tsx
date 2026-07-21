import { FileText } from "lucide-react";
import type { Source } from "@/types";

export function SourcesPanel({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {sources.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-md border border-border bg-slate-50 px-2.5 py-1 text-xs text-foreground/80"
          title={s.snippet}
        >
          <FileText className="h-3 w-3 text-primary" />
          <span className="font-medium">{s.document}</span>
          {s.page !== undefined && <span className="text-muted">· p.{s.page}</span>}
        </div>
      ))}
    </div>
  );
}
