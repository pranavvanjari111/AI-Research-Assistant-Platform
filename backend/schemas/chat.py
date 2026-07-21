from datetime import datetime

from pydantic import BaseModel, Field


class ChatConfig(BaseModel):
    llm: str = "gpt-4o"
    embeddingModel: str = "text-embedding-3-small"
    retriever: str = "compression"
    topK: int = Field(default=5, ge=1, le=20)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    config: ChatConfig = ChatConfig()


class Source(BaseModel):
    document: str
    page: int | None = None
    score: float | None = None
    snippet: str | None = None


class EvaluationScores(BaseModel):
    retrieval: float
    answer: float
    overall: float
    grounded: bool
    feedback: str | None = None


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class LimitsOut(BaseModel):
    max_conversations: int
    max_messages_per_conversation: int
    conversations_used: int


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict] = Field(default_factory=list)
    evaluation: dict | None = None
    created_at: datetime
