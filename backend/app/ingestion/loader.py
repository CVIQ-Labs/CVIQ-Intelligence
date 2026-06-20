from app.ingestion.parser import extract_text_from_pdf, extract_text_from_docx
from app.core.exceptions import InvalidFileTypeError, EmptyDocumentError


def load_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    name = filename.lower()

    if not name.endswith((".pdf", ".txt", ".docx")):
        raise InvalidFileTypeError(f"Unsupported file type: {filename}")

    if name.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    elif name.endswith(".docx"):
        text = extract_text_from_docx(file_bytes)
    else:
        text = file_bytes.decode("utf-8", errors="ignore")

    if not text.strip():
        raise EmptyDocumentError("No text could be extracted from the document.")

    return text
