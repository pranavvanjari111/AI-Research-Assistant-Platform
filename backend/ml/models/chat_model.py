"""
Chat LLM factory.

Provider selection is automatic:
  1. If OPENAI_API_KEY is set, use OpenAI (best quality, costs money).
  2. Else if HUGGINGFACEHUB_API_TOKEN is set, use a free Hugging Face
     Inference API chat model (HF_CHAT_MODEL in .env, default zephyr-7b-beta).
  3. Else raise a clear error explaining both options.
"""

from core.config import settings
from ml.config import CHAT_MODEL, HF_CHAT_MODEL


def _get_openai_chat_model():
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=CHAT_MODEL,
        temperature=settings.default_temperature,
        streaming=True,
        api_key=settings.openai_api_key,
    )


def _get_huggingface_chat_model():
    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

    llm = HuggingFaceEndpoint(
        repo_id=HF_CHAT_MODEL,
        huggingfacehub_api_token=settings.huggingfacehub_api_token,
        temperature=max(settings.default_temperature, 0.01),  # HF rejects 0.0
        max_new_tokens=768,
        streaming=True,
    )
    return ChatHuggingFace(llm=llm)


def get_chat_model():
    if settings.openai_configured:
        return _get_openai_chat_model()

    if settings.huggingface_configured:
        return _get_huggingface_chat_model()

    raise ValueError(
        "No LLM provider is configured. Set one of the following in backend/.env:\n"
        '  OPENAI_API_KEY="sk-..."           (paid, best quality)\n'
        '  HUGGINGFACEHUB_API_TOKEN="hf_..." (free, get one at '
        "https://huggingface.co/settings/tokens)"
    )
