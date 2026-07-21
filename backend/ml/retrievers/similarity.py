def similarity_retriever(vectorstore):
    retriever = vectorstore.as_retriever(
        search_type = 'similarity',
        search_kwargs= {"k":4}
    )

    return retriever
