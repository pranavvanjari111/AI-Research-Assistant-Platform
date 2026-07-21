import { useState } from "react";
import { Copy, Check, RotateCcw, BrainCircuit } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SourcesPanel } from "./SourcesPanel";
import { ThinkingIndicator } from "./ThinkingIndicator";
import type { ChatMessageType } from "@/types";
import { cn } from "@/lib/utils";

interface AssistantMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
}

export function AssistantMessage({ message, onRegenerate }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const showEmptyThinking = message.isStreaming && !message.content;

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
        <BrainCircuit className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {showEmptyThinking ? (
          <ThinkingIndicator />
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        {!message.isStreaming && message.sources && message.sources.length > 0 && (
          <SourcesPanel sources={message.sources} />
        )}

        {!message.isStreaming && message.content && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            )}
            {message.evaluation && (
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium",
                  message.evaluation.grounded
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                )}
              >
                {message.evaluation.grounded ? "Grounded" : "Ungrounded"} · {Math.round(message.evaluation.overall * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
