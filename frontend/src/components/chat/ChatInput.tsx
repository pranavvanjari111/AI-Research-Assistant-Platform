import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled, disabledMessage }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  return (
    <div className="shrink-0 border-t border-border bg-background px-4 pb-4 pt-3 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-border bg-white p-2 shadow-soft focus-within:ring-2 focus-within:ring-primary/30">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder="Ask anything about your documents..."
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          className="max-h-[180px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white transition-colors hover:bg-slate-700"
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            )}
            title="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted">
        {disabled && disabledMessage
          ? disabledMessage
          : "Responses are generated from your uploaded documents and may be inaccurate."}
      </p>
    </div>
  );
}
