import { useEffect, useState } from "react";
import {
  Plus,
  Upload,
  Database,
  SlidersHorizontal,
  Code2,
  Settings,
  BrainCircuit,
  Trash2,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import type { ChatLimits, Conversation, User } from "@/types";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

interface SidebarProps {
  conversations: Conversation[];
  conversationsLoading?: boolean;
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onOpenUpload: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenConfiguration: () => void;
  onOpenSettings: () => void;
  developerMode: boolean;
  onToggleDeveloperMode: (value: boolean) => void;
  user?: User | null;
  onLogout?: () => void;
  newChatDisabled?: boolean;
  limits?: ChatLimits | null;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  conversations,
  conversationsLoading,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onOpenUpload,
  onOpenKnowledgeBase,
  onOpenConfiguration,
  onOpenSettings,
  developerMode,
  onToggleDeveloperMode,
  user,
  onLogout,
  newChatDisabled,
  limits,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [collapsedDesktop, setCollapsedDesktop] = useState(false);
  const isDesktop = useIsDesktop();
  const collapsed = isDesktop && collapsedDesktop;

  // On mobile, any action that navigates/selects should close the drawer.
  const closeOnMobile = () => {
    if (!isDesktop) onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 animate-fade-in md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[280px] -translate-x-full flex-col border-r border-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width]",
          mobileOpen && "translate-x-0",
          collapsed ? "md:w-[64px]" : "md:w-[260px]"
        )}
      >
      {/* Logo */}
      <button
        onClick={() => setCollapsedDesktop((c) => !c)}
        className="flex items-center gap-2.5 px-4 py-4 text-left"
        title="Toggle sidebar"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-white">
          <BrainCircuit className="h-4.5 w-4.5" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">
            Research Assistant
          </span>
        )}
      </button>

      {/* New chat */}
      <div className="px-3">
        <button
          onClick={() => {
            onNewChat();
            closeOnMobile();
          }}
          disabled={newChatDisabled}
          title={newChatDisabled ? `You've reached the limit of ${limits?.maxConversations ?? 2} chats` : undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-slate-50",
            collapsed && "justify-center px-0",
            newChatDisabled && "cursor-not-allowed opacity-50 hover:bg-white"
          )}
        >
          <Plus className="h-4 w-4 text-primary" />
          {!collapsed && "New chat"}
        </button>
        {!collapsed && limits && (
          <p className="mt-1 px-1 text-[11px] text-muted">
            {conversations.length}/{limits.maxConversations} chats used
          </p>
        )}
      </div>

      {/* Primary nav */}
      <nav className="mt-3 flex flex-col gap-0.5 px-3">
        <NavItem
          icon={Upload}
          label="Upload documents"
          collapsed={collapsed}
          onClick={() => {
            onOpenUpload();
            closeOnMobile();
          }}
        />
        <NavItem
          icon={Database}
          label="Knowledge base"
          collapsed={collapsed}
          onClick={() => {
            onOpenKnowledgeBase();
            closeOnMobile();
          }}
        />
        <NavItem
          icon={SlidersHorizontal}
          label="Configuration"
          collapsed={collapsed}
          onClick={() => {
            onOpenConfiguration();
            closeOnMobile();
          }}
        />
      </nav>

      {/* Conversation history */}
      {!collapsed && (
        <div className="mt-4 flex-1 overflow-y-auto px-3">
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Recent
          </p>
          <div className="flex flex-col gap-0.5">
            {conversationsLoading && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading history...
              </div>
            )}
            {!conversationsLoading && conversations.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted">No conversations yet</p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center rounded-sm text-sm text-foreground/80 transition-colors hover:bg-slate-100",
                  activeConversationId === c.id && "bg-primary-light text-primary"
                )}
              >
                <button
                  onClick={() => {
                    onSelectConversation(c.id);
                    closeOnMobile();
                  }}
                  className="min-w-0 flex-1 truncate px-2 py-1.5 text-left"
                >
                  {c.title}
                  {limits && typeof c.messageCount === "number" && (
                    <span className="ml-1.5 text-[10px] text-muted">
                      {c.messageCount}/{limits.maxMessagesPerConversation}
                    </span>
                  )}
                </button>
                {onDeleteConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(c.id);
                    }}
                    title="Delete conversation"
                    className="mr-1 shrink-0 rounded-sm p-1 text-muted opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      {/* Footer */}
      <div className="border-t border-border px-3 py-3">
        <div
          className={cn(
            "mb-1 flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground/80",
            collapsed && "justify-center"
          )}
        >
          <Code2 className="h-4 w-4 shrink-0 text-muted" />
          {!collapsed && <span className="flex-1">Developer mode</span>}
          {!collapsed && (
            <Switch checked={developerMode} onCheckedChange={onToggleDeveloperMode} />
          )}
        </div>
        <NavItem
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
          onClick={() => {
            onOpenSettings();
            closeOnMobile();
          }}
        />

        {user && (
          <div
            className={cn(
              "mt-2 flex items-center gap-2 border-t border-border pt-2.5",
              collapsed && "flex-col"
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
                <p className="truncate text-[11px] text-muted">{user.email}</p>
              </div>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out"
                className="shrink-0 rounded-sm p-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      </aside>
    </>
  );
}

function NavItem({
  icon: Icon,
  label,
  collapsed,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-slate-100",
        collapsed && "justify-center"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      {!collapsed && label}
    </button>
  );
}
