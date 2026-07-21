from pathlib import Path

from langchain_community.vectorstores import FAISS

from ml.embeddings.embedding_model import get_embedding_model


def create_vectorstore(chunks):
    if not chunks:
        raise ValueError("No document chunks were created. Upload a readable document first.")

    embedding_model = get_embedding_model()
    vectorstore = FAISS.from_documents(
        documents=chunks,
        embedding=embedding_model,
    )

    return vectorstore


def save_vectorstore(vectorstore, vector_db_dir: Path):
    vector_db_dir.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(vector_db_dir))


def load_vectorstore(vector_db_dir: Path):
    embedding_model = get_embedding_model()

    return FAISS.load_local(
        str(vector_db_dir),
        embeddings=embedding_model,
        allow_dangerous_deserialization=True,
    )


def vectorstore_exists(vector_db_dir: Path) -> bool:
    return (vector_db_dir / "index.faiss").exists()
