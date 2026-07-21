export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-slate-400 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-slate-400 [animation-delay:200ms]" />
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-slate-400 [animation-delay:400ms]" />
    </div>
  );
}
