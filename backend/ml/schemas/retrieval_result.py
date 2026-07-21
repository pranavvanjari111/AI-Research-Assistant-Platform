from dataclasses import dataclass

from langchain_core.documents import Document
from langchain_core.prompt_values import ChatPromptValue


@dataclass
class RetrievalResult:

    retrieved_docs: list[Document]

    context: str

    prompt: ChatPromptValue