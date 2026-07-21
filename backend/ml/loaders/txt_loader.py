from langchain_community.document_loaders import TextLoader

def load_txt(path):
    loader = TextLoader(path)
    documents = loader.load()
    return documents
