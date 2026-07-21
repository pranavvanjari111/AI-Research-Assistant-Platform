import { useEffect, useRef } from "react";
import { FileSearch } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { ChatMessageType } from "@/types";

interface ChatPanelProps {
  messages: ChatMessageType[];
  onSend: (message: string) => void;
  onStop: () => void;
  onRegenerate: (messageId: string) => void;
  isStreaming: boolean;
  hasDocuments: boolean;
  inputDisabled?: boolean;
  inputDisabledMessage?: string;
}

export function ChatPanel({
  messages,
  onSend,
  onStop,
  onRegenerate,
  isStreaming,
  hasDocuments,
  inputDisabled,
  inputDisabledMessage,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
          {messages.length === 0 && <EmptyState hasDocuments={hasDocuments} />}
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} onRegenerate={m.role === "assistant" ? () => onRegenerate(m.id) : undefined} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={inputDisabled}
        disabledMessage={inputDisabledMessage}
      />
    </div>
  );
}

function EmptyState({ hasDocuments }: { hasDocuments: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-primary">
        <FileSearch className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        {hasDocuments ? "Ask a question about your documents" : "Upload documents to get started"}
      </h2>
      <p className="max-w-sm text-sm text-muted">
        {hasDocuments
          ? "Your knowledge base is ready. Ask anything and I'll answer using retrieved context, with citations."
          : "Add PDFs, Word docs, or text files from the sidebar. I'll chunk, embed, and index them automatically."}
      </p>
    </div>
  );
}
