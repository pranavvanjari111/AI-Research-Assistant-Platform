"""
Embedding model factory.

Provider selection is automatic:
  1. If OPENAI_API_KEY is set, use OpenAI embeddings (paid, best quality).
  2. Else use a local sentence-transformers model via HuggingFaceEmbeddings
     (HF_EMBEDDING_MODEL in .env, default all-MiniLM-L6-v2). This runs
     entirely on your machine/CPU and needs no API key at all -- only an
     internet connection the first time, to download the model weights.
"""

from functools import lru_cache

from core.config import settings
from ml.config import EMBEDDING_MODEL, HF_EMBEDDING_MODEL


def _get_openai_embeddings():
    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        api_key=settings.openai_api_key,
    )


@lru_cache
def _get_local_huggingface_embeddings():
    # Cached: loading the sentence-transformers model is relatively slow
    # and should only happen once per process, not once per request.
    from langchain_huggingface import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name=HF_EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def get_embedding_model():
    if settings.openai_configured:
        return _get_openai_embeddings()

    return _get_local_huggingface_embeddings()
