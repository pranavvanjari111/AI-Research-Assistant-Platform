from langchain_text_splitters import RecursiveCharacterTextSplitter

from ml.config import CHUNK_OVERLAP, CHUNK_SIZE


def split_documents(document):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    return splitter.split_documents(document)
