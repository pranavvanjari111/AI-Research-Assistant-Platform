from pathlib import Path
from ml.loaders.loader_factory import load_document

def load_folder(folder_path):
    documents = []

    for file in Path(folder_path).iterdir():
        if file.is_file():
            try:
                docs = load_document(file)
                documents.extend(docs)
            except Exception as e:
                print(f"Skipped {file.name}: {e}")

    return documents