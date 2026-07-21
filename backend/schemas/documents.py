from typing import Literal

from pydantic import BaseModel

DocumentStatus = Literal["uploading", "chunking", "embedding", "ready", "error"]
DocumentType = Literal["pdf", "docx", "txt", "md"]


class DocumentItem(BaseModel):
    id: str
    name: str
    type: DocumentType
    status: DocumentStatus = "ready"
    chunkCount: int | None = None
    sizeBytes: int | None = None
    uploadedAt: str | None = None


class ChunkItem(BaseModel):
    id: str
    documentId: str
    documentName: str
    index: int
    content: str
    tokenCount: int | None = None
