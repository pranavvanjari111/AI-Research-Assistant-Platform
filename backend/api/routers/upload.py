import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openai import OpenAIError

from api.deps import get_current_user, get_document_service, refresh_chat_service
from core.config import settings

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    service=Depends(get_document_service),
):
    if not settings.llm_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "No LLM provider is configured. Add OPENAI_API_KEY (paid) or "
                "HUGGINGFACEHUB_API_TOKEN (free) to backend/.env, then restart "
                "the backend server."
            ),
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="No files uploaded.",
        )

    user_id = str(current_user["_id"])
    raw_dir = settings.raw_data_dir_for(user_id)
    raw_dir.mkdir(parents=True, exist_ok=True)

    uploaded_files = []

    for file in files:
        ext = Path(file.filename or "").suffix.lower()

        if ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'.",
            )

        save_path = raw_dir / (file.filename or "upload")

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        uploaded_files.append(file.filename)

    try:
        service.ingest_documents()
        service.create_chunks()
        service.create_vectorstore()
        refresh_chat_service(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OpenAIError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"OpenAI API error while building the knowledge base: {exc}",
        ) from exc
    except Exception as exc:
        try:
            from huggingface_hub.errors import HfHubHTTPError

            if isinstance(exc, HfHubHTTPError):
                raise HTTPException(
                    status_code=503,
                    detail=f"Hugging Face API error while building the knowledge base: {exc}",
                ) from exc
        except ImportError:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build the knowledge base: {exc}",
        ) from exc

    stats = service.stats()

    return {
        "success": True,
        "message": "Knowledge Base created successfully.",
        "uploaded_files": uploaded_files,
        "documents": stats["documents"],
        "chunks": stats["chunks"],
        "vectorstore_ready": stats["vectorstore_ready"],
    }
