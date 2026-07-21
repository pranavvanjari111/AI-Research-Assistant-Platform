from pathlib import Path

from ml.loaders.pdf_loader import load_pdf
from ml.loaders.txt_loader import load_txt
from ml.loaders.docx_loader import load_docx
from ml.loaders.markdown_loader import load_markdown

def load_document(file_path):

    extensions = Path(file_path).suffix.lower()

    if extensions == ".pdf":
        return load_pdf(file_path)
    elif extensions == ".txt":
        return load_txt(file_path)
    elif extensions == ".docx":
        return load_docx(file_path)
    elif extensions in {".md", ".markdown"}:
        return load_markdown(file_path)
    else:
        raise ValueError(f"Extension {extensions} not supported, please try something else.")