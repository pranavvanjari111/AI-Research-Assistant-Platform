from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from db.mongo import ensure_indexes, mongo_configured
from api.routers import auth, chat, conversations, upload, status, documents, chunks, evaluation

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(chat.router, prefix=settings.api_prefix)
app.include_router(conversations.router, prefix=settings.api_prefix)
app.include_router(upload.router, prefix=settings.api_prefix)
app.include_router(status.router, prefix=settings.api_prefix)
app.include_router(documents.router, prefix=settings.api_prefix)
app.include_router(chunks.router, prefix=settings.api_prefix)
app.include_router(evaluation.router, prefix=settings.api_prefix)


@app.on_event("startup")
def validate_startup_config():
    settings.raw_data_dir.mkdir(parents=True, exist_ok=True)
    settings.vector_db_dir.mkdir(parents=True, exist_ok=True)

    if not settings.llm_configured:
        print(
            "WARNING: No LLM provider configured. Add OPENAI_API_KEY (paid) or "
            "HUGGINGFACEHUB_API_TOKEN (free) to backend/.env before uploading documents."
        )
    else:
        print(f"LLM provider: {settings.active_llm_provider} | embeddings: {settings.active_embedding_provider}")

    if not mongo_configured():
        print(
            "WARNING: MONGODB_URI is not set. "
            "Add it to backend/.env to enable authentication and chat history "
            "(e.g. MONGODB_URI=\"mongodb+srv://<user>:<password>@<cluster>.mongodb.net/\")."
        )
    else:
        try:
            ensure_indexes()
        except Exception as exc:  # noqa: BLE001 - don't crash the app over an index hiccup
            print(f"WARNING: could not connect to MongoDB Atlas at startup: {exc}")


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "docs": "/docs",
        "llm_configured": settings.llm_configured,
        "llm_provider": settings.active_llm_provider,
        "embedding_provider": settings.active_embedding_provider,
        "mongodb_configured": mongo_configured(),
    }
