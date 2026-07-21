import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { UploadDialog } from "@/components/upload/UploadDialog";
import { KnowledgeBaseDialog } from "@/components/upload/KnowledgeBaseDialog";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { DeveloperDrawer } from "@/components/developer/DeveloperDrawer";
import { AuthPage } from "@/pages/auth/AuthPage";
import { useAuth } from "@/context/AuthContext";
import {
  deleteConversation,
  getChatLimits,
  getConversationMessages,
  getConversations,
  getDocuments,
  streamChat,
  uploadDocument,
} from "@/api/client";
import type { AppConfig, ChatLimits, ChatMessageType, Conversation, DocumentItem } from "@/types";

const DEFAULT_CONFIG: AppConfig = {
  llm: "gpt-4o",
  embeddingModel: "text-embedding-3-small",
  retriever: "compression",
  topK: 5,
  temperature: 0.2,
};

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <Workspace />;
}

function Workspace() {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessagesFor, setLoadingMessagesFor] = useState<string | null>(null);
  const [limits, setLimits] = useState<ChatLimits | null>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [developerMode, setDeveloperMode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const loadedMessagesRef = useRef<Set<string>>(new Set());

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const hasReadyDocuments = documents.some((d) => d.status === "ready");
  const noKnowledgeBase = !documentsLoading && !hasReadyDocuments;

  const atConversationLimit = !!limits && conversations.length >= limits.maxConversations;
  const activeUserMessageCount = messages.filter((m) => m.role === "user").length;
  const atMessageLimitForActive =
    !!limits && activeId !== null && activeUserMessageCount >= limits.maxMessagesPerConversation;

  const inputDisabled =
    noKnowledgeBase || (activeId === null ? atConversationLimit : atMessageLimitForActive);
  const inputDisabledMessage = noKnowledgeBase
    ? "Upload at least one document to build your knowledge base before you can start chatting."
    : activeId === null
      ? limits
        ? `You've reached the limit of ${limits.maxConversations} chats. Delete one to start a new chat.`
        : undefined
      : limits
        ? `This chat has reached its ${limits.maxMessagesPerConversation}-message limit. Start a new chat to continue.`
        : undefined;

  // Load the user's chat history (conversation list) from MongoDB on sign-in.
  useEffect(() => {
    let cancelled = false;
    setLoadingConversations(true);
    getConversations()
      .then((convs) => {
        if (!cancelled) setConversations(convs);
      })
      .catch(() => {
        // Non-fatal: history stays empty if it can't be loaded.
      })
      .finally(() => {
        if (!cancelled) setLoadingConversations(false);
      });
    getChatLimits()
      .then((l) => {
        if (!cancelled) setLimits(l);
      })
      .catch(() => {
        // Non-fatal: limits UI just won't show until this succeeds.
      });
    setDocumentsLoading(true);
    getDocuments()
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch(() => {
        // Non-fatal: knowledge-base UI just stays empty until upload/refresh.
      })
      .finally(() => {
        if (!cancelled) setDocumentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      if (loadedMessagesRef.current.has(id)) return;
      setLoadingMessagesFor(id);
      try {
        const msgs = await getConversationMessages(id);
        loadedMessagesRef.current.add(id);
        updateConversation(id, (c) => ({ ...c, messages: msgs }));
      } catch {
        // Leave the conversation empty if history can't be fetched.
      } finally {
        setLoadingMessagesFor(null);
      }
    },
    [updateConversation]
  );

  const handleNewChat = () => {
    if (atConversationLimit) return;
    setActiveId(null);
  };

  const handleDeleteConversation = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    loadedMessagesRef.current.delete(id);
    if (activeId === id) setActiveId(null);
    try {
      await deleteConversation(id);
    } catch {
      // Already removed from the UI; a stale row will just reappear on next reload if this failed.
    }
  };

  const handleSend = async (text: string) => {
    if (inputDisabled) return;

    let convId = activeId;
    const isNewConversation = !convId;

    if (isNewConversation) {
      const conv: Conversation = {
        id: newId(),
        title: text.slice(0, 40),
        messages: [],
        createdAt: new Date().toISOString(),
      };
      setConversations((prev) => [conv, ...prev]);
      convId = conv.id;
      setActiveId(conv.id);
      loadedMessagesRef.current.add(conv.id);
    }

    const userMessage: ChatMessageType = {
      id: newId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: ChatMessageType = {
      id: newId(),
      role: "assistant",
      content: "",
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    updateConversation(convId!, (c) => ({
      ...c,
      title: c.messages.length === 0 ? text.slice(0, 40) : c.title,
      messages: [...c.messages, userMessage, assistantMessage],
      messageCount: (c.messageCount ?? c.messages.filter((m) => m.role === "user").length) + 1,
    }));

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // For a brand-new chat we don't have a server-side conversation id yet;
    // the backend creates one in MongoDB and reports it back via onConversationId.
    await streamChat(
      text,
      isNewConversation ? null : convId,
      config,
      {
        onConversationId: (serverConversationId) => {
          if (isNewConversation && serverConversationId && serverConversationId !== convId) {
            const localId = convId!;
            loadedMessagesRef.current.delete(localId);
            loadedMessagesRef.current.add(serverConversationId);
            setConversations((prev) =>
              prev.map((c) => (c.id === localId ? { ...c, id: serverConversationId } : c))
            );
            setActiveId(serverConversationId);
            convId = serverConversationId;
          }
        },
        onToken: (token) => {
          updateConversation(convId!, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: m.content + token } : m
            ),
          }));
        },
        onSources: (sources) => {
          updateConversation(convId!, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === assistantMessage.id ? { ...m, sources } : m)),
          }));
        },
        onEvaluation: (evaluation) => {
          updateConversation(convId!, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === assistantMessage.id ? { ...m, evaluation } : m)),
          }));
        },
        onDone: () => {
          updateConversation(convId!, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
            ),
          }));
          setIsStreaming(false);
        },
        onError: (err) => {
          updateConversation(convId!, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    isStreaming: false,
                    content: m.content || err.message || "I couldn't reach the backend. Confirm the FastAPI server is running on port 8000.",
                  }
                : m
            ),
          }));
          setIsStreaming(false);
        },
      },
      controller.signal
    );
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleRegenerate = (messageId: string) => {
    if (!activeConversation) return;
    const idx = activeConversation.messages.findIndex((m) => m.id === messageId);
    const prevUser = [...activeConversation.messages.slice(0, idx)].reverse().find((m) => m.role === "user");
    if (prevUser) handleSend(prevUser.content);
  };

  const handleUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() as DocumentItem["type"];
      const docId = newId();
      const placeholder: DocumentItem = {
        id: docId,
        name: file.name,
        type: ext,
        status: "uploading",
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [placeholder, ...prev]);

      try {
        const result = await uploadDocument(file, (status) => {
          setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
        });
        setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...result, id: docId } : d)));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: "error", name: `${d.name} (${message})` } : d))
        );
      }
    }

    // Re-sync with the backend's authoritative per-user document list
    // (dedupes anything the optimistic placeholders above got slightly wrong).
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch {
      // Keep the optimistic local state if this refresh fails.
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar
          conversations={conversations}
          conversationsLoading={loadingConversations}
          activeConversationId={activeId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onOpenUpload={() => setUploadOpen(true)}
          onOpenKnowledgeBase={() => setKbOpen(true)}
          onOpenConfiguration={() => setSettingsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          developerMode={developerMode}
          onToggleDeveloperMode={(v) => {
            setDeveloperMode(v);
            if (v) setDevOpen(true);
          }}
          user={user}
          onLogout={logout}
          newChatDisabled={atConversationLimit}
          limits={limits}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
          {activeId !== null && loadingMessagesFor === activeId && messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <ChatPanel
              messages={messages}
              onSend={handleSend}
              onStop={handleStop}
              onRegenerate={handleRegenerate}
              isStreaming={isStreaming}
              hasDocuments={hasReadyDocuments}
              inputDisabled={inputDisabled}
              inputDisabledMessage={inputDisabledMessage}
            />
          )}
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} documents={documents} onUpload={handleUpload} />
      <KnowledgeBaseDialog open={kbOpen} onOpenChange={setKbOpen} documents={documents} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} config={config} onChange={setConfig} />
      {developerMode && (
        <DeveloperDrawer
          open={devOpen}
          onOpenChange={setDevOpen}
          documents={documents}
          chunks={[]}
          retrievedContext={[]}
          lastPrompt=""
          evaluation={activeConversation?.messages.filter((m) => m.role === "assistant").at(-1)?.evaluation ?? null}
        />
      )}
    </TooltipProvider>
  );
}
