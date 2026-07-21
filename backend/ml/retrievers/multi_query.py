from langchain.retrievers import MultiQueryRetriever
from ml.models.chat_model import get_chat_model

def get_multi_query_retriever(vectorstore):
    llm = get_chat_model()
    retriever = vectorstore.as_retriever(
        search_kwargs = {"k":4}
    )

    return MultiQueryRetriever.from_llm(
        retriever = retriever,
        llm = llm,
    )