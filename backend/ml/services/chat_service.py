import time

from langchain_core.runnables import RunnableConfig
from langchain_core.runnables.history import RunnableWithMessageHistory

from ml.memory.history import get_session_history
from ml.models.chat_model import get_chat_model
from ml.prompts.qa_prompt import QA_PROMPT
from ml.retrievers.retriever_factory import get_retriever

from ml.schemas.chat_result import ChatResult
from ml.schemas.research_answer import ResearchAnswer
from ml.schemas.retrieval_result import RetrievalResult

from ml.utils.document_formatter import format_docs


class ChatService:

    def __init__(self, vectorstore):

        self.llm = (
            get_chat_model()
            .with_structured_output(ResearchAnswer)
        )

        self.retriever = get_retriever(vectorstore)

        self.prompt = QA_PROMPT

        base_chain = (
            self.prompt
            | self.llm
        )

        self.chain = RunnableWithMessageHistory(
            base_chain,
            get_session_history,
            input_messages_key="question",
            history_messages_key="history",
        )

    def retrieve(self, question: str) -> RetrievalResult:

        retrieved_docs = self.retriever.invoke(question)

        context = format_docs(retrieved_docs)

        prompt = self.prompt.invoke(
            {
                "context": context,
                "question": question,
                "history": []
            }
        )

        return RetrievalResult(
            retrieved_docs=retrieved_docs,
            context=context,
            prompt=prompt
        )

    def ask(self, question: str, session_id: str = "default") -> ChatResult:

        start = time.perf_counter()

        retrieval = self.retrieve(question)

        config: RunnableConfig = {
            "configurable": {
                "session_id": session_id
            }
        }

        answer: ResearchAnswer = self.chain.invoke(
            {
                "context": retrieval.context,
                "question": question,
            },
            config=config
        )

        end = time.perf_counter()

        return ChatResult(
            question=question,
            answer=answer,
            retrieved_docs=retrieval.retrieved_docs,
            context=retrieval.context,
            prompt=retrieval.prompt.to_string(),
            response_time=round(end - start, 3)
        )