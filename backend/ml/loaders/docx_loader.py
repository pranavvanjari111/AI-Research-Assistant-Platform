from langchain_community.document_loaders import Docx2txtLoader

def load_docx(path: str):
    loader = Docx2txtLoader(path)
    documents = loader.load()
    return documents
