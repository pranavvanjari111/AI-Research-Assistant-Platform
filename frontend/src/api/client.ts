import type {
  AppConfig,
  ChatLimits,
  ChatMessageType,
  ChunkItem,
  Conversation,
  DocumentItem,
  EvaluationScores,
  Source,
  User,
} from "@/types";

const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE_URL = `${API_ROOT}/api`;
const TOKEN_STORAGE_KEY = "ara_access_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorDetail(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await res.json();
    return typeof body.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

function mapUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id),
    name: String(raw.name),
    email: String(raw.email),
    createdAt: String(raw.created_at),
  };
}

export interface AuthResult {
  token: string;
  user: User;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Registration failed"));
  }
  const data = await res.json();
  return { token: data.access_token, user: mapUser(data.user) };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Login failed"));
  }
  const data = await res.json();
  return { token: data.access_token, user: mapUser(data.user) };
}

export async function demoLogin(): Promise<AuthResult> {
  const res = await fetch(`${BASE_URL}/auth/demo`, { method: "POST" });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Demo login failed"));
  }
  const data = await res.json();
  return { token: data.access_token, user: mapUser(data.user) };
}

export async function fetchMe(): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Failed to load account"));
  }
  return mapUser(await res.json());
}

export async function getChatLimits(): Promise<ChatLimits> {
  const res = await fetch(`${BASE_URL}/conversations/limits`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Failed to load chat limits"));
  }
  const data = await res.json();
  return {
    maxConversations: data.max_conversations,
    maxMessagesPerConversation: data.max_messages_per_conversation,
    conversationsUsed: data.conversations_used,
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    throw new Error(
      await parseErrorDetail(res, "Failed to load conversations"),
    );
  }
  const data = await res.json();
  return (data as Record<string, unknown>[]).map((c) => ({
    id: String(c.id),
    title: String(c.title),
    messages: [],
    messageCount: Number(c.message_count ?? 0),
    createdAt: String(c.created_at),
  }));
}

export async function getConversationMessages(
  conversationId: string,
): Promise<ChatMessageType[]> {
  const res = await fetch(
    `${BASE_URL}/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      headers: { ...authHeaders() },
    },
  );
  if (!res.ok) {
    throw new Error(await parseErrorDetail(res, "Failed to load messages"));
  }
  const data = await res.json();
  return (data as Record<string, unknown>[]).map((m) => ({
    id: String(m.id),
    role: (m.role as ChatMessageType["role"]) ?? "assistant",
    content: String(m.content ?? ""),
    sources:
      Array.isArray(m.sources) && m.sources.length
        ? mapSources(m.sources as unknown[])
        : undefined,
    evaluation: m.evaluation
      ? mapEvaluation(m.evaluation as Record<string, unknown>)
      : undefined,
    createdAt: String(m.created_at),
  }));
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "DELETE",
      headers: { ...authHeaders() },
    },
  );
  if (!res.ok && res.status !== 204) {
    throw new Error(
      await parseErrorDetail(res, "Failed to delete conversation"),
    );
  }
}

export interface ChatStreamHandlers {
  onToken: (token: string) => void;
  onConversationId?: (conversationId: string) => void;
  onSources?: (sources: Source[]) => void;
  onEvaluation?: (evaluation: EvaluationScores) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

function mapEvaluation(raw: Record<string, unknown>): EvaluationScores {
  return {
    retrieval: Number(raw.retrieval_score ?? raw.retrieval ?? 0),
    answer: Number(raw.answer_score ?? raw.answer ?? 0),
    overall: Number(raw.overall_score ?? raw.overall ?? 0),
    grounded: Boolean(raw.grounded),
    feedback: typeof raw.feedback === "string" ? raw.feedback : undefined,
  };
}

function mapSources(rawSources: unknown[]): Source[] {
  return rawSources.map((item) => {
    const meta = item as Record<string, unknown>;
    const source = String(meta.source ?? meta.filename ?? "Unknown");
    return {
      document: source.split(/[/\\]/).pop() ?? source,
      page: typeof meta.page === "number" ? meta.page : undefined,
      score: typeof meta.score === "number" ? meta.score : undefined,
      snippet: typeof meta.snippet === "string" ? meta.snippet : undefined,
    };
  });
}

/**
 * Streams a chat response from the backend using newline-delimited JSON events.
 */
export async function streamChat(
  message: string,
  conversationId: string | null,
  config: AppConfig,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
) {
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        config,
      }),
      signal,
    });

    if (res.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (res.status === 403) {
      throw new Error(await parseErrorDetail(res, "You've hit a chat limit."));
    }

    if (!res.ok || !res.body) {
      throw new Error(
        await parseErrorDetail(
          res,
          `Chat request failed with status ${res.status}`,
        ),
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finished = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "token" || event.type === "answer") {
            handlers.onToken(event.content ?? "");
          } else if (event.type === "conversation") {
            handlers.onConversationId?.(String(event.conversation_id ?? ""));
          } else if (event.type === "sources") {
            handlers.onSources?.(mapSources(event.sources ?? []));
          } else if (event.type === "evaluation") {
            handlers.onEvaluation?.(mapEvaluation(event.evaluation ?? event));
          } else if (event.type === "done") {
            if (!finished) {
              finished = true;
              handlers.onDone?.();
            }
          }
        } catch {
          // ignore malformed partial chunk
        }
      }
    }

    if (!finished) handlers.onDone?.();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError?.(err as Error);
  }
}

export async function uploadDocument(
  file: File,
  onProgress?: (status: DocumentItem["status"]) => void,
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("files", file);

  onProgress?.("uploading");
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) {
    let detail = "Upload failed";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(detail);
  }

  onProgress?.("chunking");
  onProgress?.("embedding");

  const data = await res.json();
  const ext = file.name.split(".").pop()?.toLowerCase() as DocumentItem["type"];

  onProgress?.("ready");
  return {
    id: file.name,
    name: file.name,
    type: ext ?? "txt",
    status: "ready",
    chunkCount: data.chunks,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function getStatus() {
  const res = await fetch(`${BASE_URL}/status`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${BASE_URL}/documents`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function getChunks(documentId?: string): Promise<ChunkItem[]> {
  const url = documentId
    ? `${BASE_URL}/chunks?document_id=${encodeURIComponent(documentId)}`
    : `${BASE_URL}/chunks`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Failed to fetch chunks");
  return res.json();
}

export async function getEvaluation(): Promise<EvaluationScores> {
  const res = await fetch(`${BASE_URL}/evaluation`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch evaluation");
  return mapEvaluation(await res.json());
}
