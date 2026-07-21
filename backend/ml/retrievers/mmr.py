def get_mmr_retriever(vectorstore):

    retriever = vectorstore.as_retriever(

        search_type="mmr",

        search_kwargs={
            "k":4,
            "fetch_k":20
        }

    )

    return retriever