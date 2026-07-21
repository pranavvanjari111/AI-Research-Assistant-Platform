import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="relative flex shrink-0 flex-col items-center justify-center border-b border-border bg-white/70 px-4 py-2.5 backdrop-blur sm:px-6">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground/80 transition-colors hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-[13px] font-semibold text-foreground">AI Research Assistant</h1>
      <p className="text-[11px] text-muted">Retrieval-Augmented Generation Workspace</p>
    </header>
  );
}
