from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

from ml.models.chat_model import get_chat_model


def get_contextual_compression_retriever(base_retriever):

    compressor = LLMChainExtractor.from_llm(
        get_chat_model()
    )

    return ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=base_retriever
    )