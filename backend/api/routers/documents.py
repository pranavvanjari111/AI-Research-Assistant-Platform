from pathlib import Path

from fastapi import APIRouter, Depends

from api.deps import get_document_service
from schemas.documents import DocumentItem, DocumentType

router = APIRouter(tags=["documents"])

EXTENSION_TO_TYPE: dict[str, DocumentType] = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".txt": "txt",
    ".md": "md",
}


@router.get("/documents", response_model=list[DocumentItem])
def list_documents(service=Depends(get_document_service)):
    chunks = service.list_chunks()

    chunk_counts: dict[str, int] = {}
    for chunk in chunks:
        source = chunk.metadata.get("source", "unknown")
        chunk_counts[source] = chunk_counts.get(source, 0) + 1

    seen: dict[str, DocumentItem] = {}
    for doc in service.list_documents():
        source = doc.metadata.get("source", "unknown")
        if source in seen:
            continue

        path = Path(source)
        ext = path.suffix.lower()
        doc_type = EXTENSION_TO_TYPE.get(ext, "txt")

        seen[source] = DocumentItem(
            id=source,
            name=path.name,
            type=doc_type,
            status="ready",
            chunkCount=chunk_counts.get(source, 0),
        )

    return list(seen.values())
