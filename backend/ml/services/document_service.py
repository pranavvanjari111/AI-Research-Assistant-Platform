from pathlib import Path

from ml.loaders.load_folder import load_folder
from ml.splitters.recursive_splitter import split_documents
from ml.vectorstores.faiss_store import (
    create_vectorstore,
    load_vectorstore,
    save_vectorstore,
    vectorstore_exists,
)


class DocumentService:
    """
    Handles ingestion/chunking/indexing for a single user's own documents.

    Every instance is scoped to its own raw-file directory and vector-store
    directory (see api/deps.py) so one user's uploads are never visible to,
    or queryable by, another user.
    """

    def __init__(self, raw_dir: Path, vector_db_dir: Path):
        self.raw_dir = Path(raw_dir)
        self.vector_db_dir = Path(vector_db_dir)

        self.documents = []
        self.chunks = []
        self.vectorstore = None

        # Reload a previously-built index for this user, if one exists on disk
        # (e.g. after a server restart), so their knowledge base survives.
        if vectorstore_exists(self.vector_db_dir):
            try:
                self.vectorstore = load_vectorstore(self.vector_db_dir)
                self.chunks = self._chunks_from_vectorstore(self.vectorstore)
            except Exception as e:
                print(f"Could not reload persisted vectorstore for {self.vector_db_dir}: {e}")

    @staticmethod
    def _chunks_from_vectorstore(vectorstore) -> list:
        # FAISS has no public "list all documents" API; its in-memory docstore
        # dict is the standard way to recover the chunks used to build the
        # index (needed so /documents and /chunks still work after a restart).
        docstore = getattr(vectorstore, "docstore", None)
        internal_dict = getattr(docstore, "_dict", None)
        return list(internal_dict.values()) if internal_dict else []

    def ingest_documents(self):
        print(f"loading documents from {self.raw_dir}...")
        self.documents = load_folder(self.raw_dir)
        print(f"Loaded {len(self.documents)} documents")
        return self.documents

    def create_chunks(self):
        print("splitting documents...")
        self.chunks = split_documents(self.documents)
        print(f"Split {len(self.chunks)} chunks")
        return self.chunks

    def create_vectorstore(self):
        print("creating vectors DB...")
        self.vectorstore = create_vectorstore(self.chunks)
        save_vectorstore(self.vectorstore, self.vector_db_dir)
        return self.vectorstore

    def list_documents(self):
        if self.documents:
            return self.documents

        # After a restart we only recover chunks (from the reloaded FAISS
        # docstore), not the original pre-split documents. Chunk metadata
        # carries the same "source" as its parent document (LangChain's
        # splitter copies metadata through), so synthesize one entry per
        # unique source -- good enough for listing purposes.
        seen_sources = set()
        synthesized = []
        for chunk in self.chunks:
            source = chunk.metadata.get("source")
            if source and source not in seen_sources:
                seen_sources.add(source)
                synthesized.append(chunk)
        return synthesized

    def list_chunks(self, document_id=None):

        if document_id is None:
            return self.chunks

        return [
            chunk
            for chunk in self.chunks
            if chunk.metadata.get("source") == document_id
        ]

    def stats(self):
        return {
            "documents": len(self.documents),
            "chunks": len(self.chunks),
            "vectorstore_ready": self.vectorstore is not None,
        }
