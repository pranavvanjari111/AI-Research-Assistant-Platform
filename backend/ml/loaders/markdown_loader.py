from langchain_community.document_loaders import TextLoader

def load_markdown(path):
    loader = TextLoader(path, encoding="utf-8")
    documents= loader.load()
    return documents