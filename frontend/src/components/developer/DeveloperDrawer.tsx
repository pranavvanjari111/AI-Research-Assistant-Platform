import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ChunkItem, DocumentItem, EvaluationScores, RetrievedContextItem } from "@/types";

interface DeveloperDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentItem[];
  chunks: ChunkItem[];
  retrievedContext: RetrievedContextItem[];
  lastPrompt: string;
  evaluation: EvaluationScores | null;
}

export function DeveloperDrawer({
  open,
  onOpenChange,
  documents,
  chunks,
  retrievedContext,
  lastPrompt,
  evaluation,
}: DeveloperDrawerProps) {
  const [tab, setTab] = useState("documents");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Developer mode</h2>
          <p className="text-xs text-muted">Inspect retrieval, prompts, and evaluation</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mb-3 flex-wrap">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="chunks">Chunks</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TabsContent value="documents" className="flex flex-col gap-2">
              {documents.length === 0 && <Empty text="No documents indexed yet" />}
              {documents.map((d) => (
                <div key={d.id} className="rounded-md border border-border p-2.5 text-xs">
                  <p className="font-medium text-foreground">{d.name}</p>
                  <p className="mt-0.5 text-muted">
                    {d.status} · {d.chunkCount ?? 0} chunks
                  </p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="chunks" className="flex flex-col gap-2">
              {chunks.length === 0 && <Empty text="No chunks to display" />}
              {chunks.map((c) => (
                <div key={c.id} className="rounded-md border border-border p-2.5">
                  <p className="mb-1 text-[11px] font-medium text-primary">
                    {c.documentName} · chunk {c.index}
                  </p>
                  <p className="line-clamp-4 text-xs text-foreground/80">{c.content}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="context" className="flex flex-col gap-2">
              {retrievedContext.length === 0 && <Empty text="No retrieved context for this turn" />}
              {retrievedContext.map((c, i) => (
                <div key={i} className="rounded-md border border-border p-2.5">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span className="font-medium text-primary">
                      {c.source}
                      {c.page !== undefined ? ` · p.${c.page}` : ""}
                    </span>
                    <span>score {c.score.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-foreground/80">{c.content}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="prompt">
              {lastPrompt ? (
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-slate-50 p-3 text-[11px] leading-relaxed text-foreground/80">
                  {lastPrompt}
                </pre>
              ) : (
                <Empty text="No prompt sent yet" />
              )}
            </TabsContent>

            <TabsContent value="evaluation">
              {evaluation ? (
                <div className="flex flex-col gap-2">
                  <ScoreRow label="Retrieval" value={evaluation.retrieval} />
                  <ScoreRow label="Answer" value={evaluation.answer} />
                  <ScoreRow label="Overall" value={evaluation.overall} />
                  <div className="flex items-center justify-between rounded-md border border-border p-2.5 text-xs">
                    <span className="text-foreground/80">Grounded</span>
                    <span className={evaluation.grounded ? "text-emerald-600" : "text-amber-600"}>
                      {evaluation.grounded ? "Yes" : "No"}
                    </span>
                  </div>
                  {evaluation.feedback && (
                    <div className="rounded-md border border-border p-2.5 text-xs text-foreground/80">
                      {evaluation.feedback}
                    </div>
                  )}
                </div>
              ) : (
                <Empty text="No evaluation for this turn" />
              )}
            </TabsContent>

            <TabsContent value="debug">
              <pre className="whitespace-pre-wrap rounded-md border border-border bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
                {JSON.stringify(
                  { documents: documents.length, chunks: chunks.length, retrievedContext: retrievedContext.length },
                  null,
                  2
                )}
              </pre>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs text-muted">{text}</p>;
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-2.5 text-xs">
      <span className="text-foreground/80">{label}</span>
      <span className="font-medium text-foreground">{Math.round(value * 100)}%</span>
    </div>
  );
}
