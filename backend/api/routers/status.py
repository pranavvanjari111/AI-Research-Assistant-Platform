from fastapi import APIRouter, Depends

from api.deps import get_current_user_optional, get_document_service_for_user
from core.config import settings
from db.mongo import mongo_configured

router = APIRouter(tags=["status"])


@router.get("/status")
def get_status(current_user: dict | None = Depends(get_current_user_optional)):
    base = {
        "status": "ok" if settings.llm_configured else "degraded",
        "ml_backend_connected": True,
        "llm_configured": settings.llm_configured,
        "llm_provider": settings.active_llm_provider,
        "embedding_provider": settings.active_embedding_provider,
        "mongodb_configured": mongo_configured(),
        "backend_url": "http://localhost:8000",
        "frontend_proxy": "/api -> http://localhost:8000",
        "authenticated": current_user is not None,
    }

    if current_user is not None:
        # Signed in: report *this user's own* knowledge base stats.
        service = get_document_service_for_user(str(current_user["_id"]))
        stats = service.stats()
        base.update(
            {
                "documents": stats["documents"],
                "chunks": stats["chunks"],
                "vectorstore_ready": stats["vectorstore_ready"],
            }
        )

    return base
