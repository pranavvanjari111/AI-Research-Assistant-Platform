from dataclasses import dataclass

from langchain_core.documents import Document

from ml.schemas.research_answer import ResearchAnswer


@dataclass
class ChatResult:

    question: str

    answer: ResearchAnswer

    retrieved_docs: list[Document]

    context: str

    prompt: str

    response_time: float