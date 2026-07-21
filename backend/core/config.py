"""
Application configuration shared by the API layer and ML pipeline.
"""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Research Assistant"
    api_prefix: str = "/api"

    # CORS - the Vite dev server default
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "https://ai-research-assistant-platform-4qkq.vercel.app",
        ]
    )

    # OpenAI
    openai_api_key: str | None = None

    # Hugging Face (free fallback when OpenAI isn't configured)
    huggingfacehub_api_token: str | None = None
    hf_chat_model: str = "HuggingFaceH4/zephyr-7b-beta"
    hf_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # MongoDB Atlas (chat history + auth)
    mongodb_uri: str | None = None
    mongodb_db_name: str = "ai_research_assistant"

    # Auth / JWT
    jwt_secret_key: str = "CHANGE_ME_dev_only_insecure_secret_key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Defaults surfaced in the frontend Configuration panel.
    default_llm: str = "gpt-4o-mini"
    default_embedding_model: str = "text-embedding-3-small"
    default_retriever: str = "similarity"
    default_top_k: int = 5
    default_temperature: float = 0.2
    chunk_size: int = 500
    chunk_overlap: int = 100
    score_threshold: float = 0.5
    fetch_k: int = 20

    # Storage
    data_dir: Path = Field(default=BACKEND_ROOT / "data")

    # Upload constraints
    max_upload_mb: int = 25
    allowed_extensions: tuple[str, ...] = (".pdf", ".docx", ".txt", ".md")

    # Per-user chat limits
    max_conversations_per_user: int = 2
    max_messages_per_conversation: int = 3

    # One-click disposable demo accounts (POST /api/auth/demo)
    demo_accounts_enabled: bool = True

    @property
    def raw_data_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def vector_db_dir(self) -> Path:
        return self.data_dir / "vector_db"

    def raw_data_dir_for(self, user_id: str) -> Path:
        return self.raw_data_dir / user_id

    def vector_db_dir_for(self, user_id: str) -> Path:
        return self.vector_db_dir / user_id

    @property
    def log_dir(self) -> Path:
        return self.data_dir / "logs"

    @property
    def openai_configured(self) -> bool:
        return bool(self.openai_api_key and self.openai_api_key.strip())

    @property
    def huggingface_configured(self) -> bool:
        return bool(self.huggingfacehub_api_token and self.huggingfacehub_api_token.strip())

    @property
    def llm_configured(self) -> bool:
        """True if we have *some* usable chat provider (OpenAI or Hugging Face)."""
        return self.openai_configured or self.huggingface_configured

    @property
    def active_llm_provider(self) -> str:
        if self.openai_configured:
            return "openai"
        if self.huggingface_configured:
            return "huggingface"
        return "none"

    @property
    def active_embedding_provider(self) -> str:
        # Embeddings fall back to a local sentence-transformers model, which
        # needs no API key at all -- so this is "openai" or "huggingface" (local),
        # never "none".
        return "openai" if self.openai_configured else "huggingface"


settings = Settings()
