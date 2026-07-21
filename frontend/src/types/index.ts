export type Role = "user" | "assistant";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Source {
  document: string;
  page?: number;
  score?: number;
  snippet?: string;
}

export interface EvaluationScores {
  retrieval: number;
  answer: number;
  overall: number;
  grounded: boolean;
  feedback?: string;
}

export interface ChatMessageType {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  evaluation?: EvaluationScores;
  isStreaming?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessageType[];
  messageCount?: number;
  createdAt: string;
}

export interface ChatLimits {
  maxConversations: number;
  maxMessagesPerConversation: number;
  conversationsUsed: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "md";
  status: "uploading" | "chunking" | "embedding" | "ready" | "error";
  chunkCount?: number;
  sizeBytes?: number;
  uploadedAt: string;
}

export interface ChunkItem {
  id: string;
  documentId: string;
  documentName: string;
  index: number;
  content: string;
  tokenCount?: number;
}

export interface AppConfig {
  llm: string;
  embeddingModel: string;
  retriever: "similarity" | "mmr" | "compression";
  topK: number;
  temperature: number;
}

export interface RetrievedContextItem {
  content: string;
  source: string;
  page?: number;
  score: number;
}
