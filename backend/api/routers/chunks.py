from pathlib import Path

from fastapi import APIRouter, Depends

from api.deps import get_document_service
from schemas.documents import ChunkItem

router = APIRouter(tags=["chunks"])


@router.get("/chunks", response_model=list[ChunkItem])
def list_chunks(document_id: str | None = None, service=Depends(get_document_service)):

    return [
        ChunkItem(
            id=f"{chunk.metadata.get('source', 'unknown')}:{index}",
            documentId=chunk.metadata.get("source", "unknown"),
            documentName=Path(chunk.metadata.get("source", "unknown")).name,
            index=index,
            content=chunk.page_content,
        )
        for index, chunk in enumerate(service.list_chunks(document_id))
    ]
