import hashlib
from datetime import datetime, timezone
from pathlib import Path

from app.ingestion.chunker import chunk_text
from app.embeddings.embedder import embed_texts
from app.vectorstore.chroma import get_collection, add_documents

KNOWLEDGE_BASE_DIR = Path("knowledge_base")
COLLECTION_NAME = "knowledge_base"


def load_knowledge_base(force: bool = False) -> dict:
    """Ingest all .md files from knowledge_base/ into ChromaDB.

    Normal startup: skips files whose chunk IDs already exist (idempotent).
    force=True: re-ingests files whose content hash has changed since last ingest.
    Returns a summary of what was loaded, updated, or skipped.
    """
    collection = get_collection(COLLECTION_NAME)
    summary: dict[str, list[str]] = {"loaded": [], "updated": [], "skipped": []}

    for md_file in sorted(KNOWLEDGE_BASE_DIR.glob("*.md")):
        raw = md_file.read_text(encoding="utf-8")
        doc_hash = hashlib.sha256(raw.encode()).hexdigest()
        chunks = chunk_text(raw)
        ids = [f"{md_file.stem}_{i}" for i in range(len(chunks))]

        existing = collection.get(ids=ids, include=["metadatas"])
        existing_ids = set(existing["ids"])

        if existing_ids:
            if not force:
                summary["skipped"].append(md_file.name)
                continue
            existing_hash = (existing["metadatas"][0] or {}).get("doc_hash")
            if existing_hash == doc_hash:
                summary["skipped"].append(md_file.name)
                continue
            collection.delete(ids=list(existing_ids))
            summary["updated"].append(md_file.name)
        else:
            summary["loaded"].append(md_file.name)

        ingested_at = datetime.now(timezone.utc).isoformat()
        metadatas = [
            {
                "source": md_file.name,
                "doc_hash": doc_hash,
                "chunk_index": i,
                "ingested_at": ingested_at,
            }
            for i in range(len(chunks))
        ]
        embeddings = embed_texts(chunks)
        add_documents(collection, chunks, embeddings, ids, metadatas)
        print(f"[kb] ingested source={md_file.name} chunks={len(chunks)} hash={doc_hash[:8]}")

    return summary
