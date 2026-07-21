from ml.config import (
    SEARCH_TYPE,
    TOP_K,
    FETCH_K,
    SCORE_THRESHOLD,
)

from ml.retrievers.multi_query import get_multi_query_retriever
from ml.retrievers.contextual_compression import (
    get_contextual_compression_retriever
)

def get_retriever(vectorstore):
    if SEARCH_TYPE == "similarity":
        return vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": TOP_K,
            },
        )
    elif SEARCH_TYPE == "mmr":
        return vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": TOP_K,
                "fetch_k": FETCH_K,
            }
        )
    elif SEARCH_TYPE == "similarity_score_threshold":
        return vectorstore.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={
                "k": TOP_K,
                "score_threshold": SCORE_THRESHOLD,
            }
        )
    elif SEARCH_TYPE == "multi_query":
        return get_multi_query_retriever(vectorstore)


    elif SEARCH_TYPE == "compression":
        retriever = vectorstore.as_retriever(
            search_kwargs={
                "k": TOP_K
            }
        )
        return get_contextual_compression_retriever(
            retriever
        )
    
    else:
        raise ValueError(f"Unknown search type: {SEARCH_TYPE}")