from fastapi import APIRouter, HTTPException

from app.vectorstore.chroma import get_collection, delete_by_source
from app.ingestion.kb_loader import load_knowledge_base

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])

COLLECTION_NAME = "knowledge_base"


@router.delete("/{source}")
def delete_document(source: str):
    """Remove all chunks for a knowledge base document by its source filename.

    Example: DELETE /knowledge-base/cv_review_rubric.md

    Uses the source metadata and doc_hash stored on every chunk at ingest time,
    so deletions are targeted — no other documents are affected.
    """
    collection = get_collection(COLLECTION_NAME)
    result = delete_by_source(collection, source)

    if not result["ids_deleted"]:
        raise HTTPException(
            status_code=404,
            detail=f"No chunks found for source '{source}'. "
                   "Check the filename matches exactly (e.g. 'cv_review_rubric.md').",
        )

    print(
        f"[knowledge-base] deleted source={source} "
        f"chunks={len(result['ids_deleted'])} "
        f"doc_hash={result['doc_hash']}"
    )

    return {
        "source": source,
        "chunks_deleted": len(result["ids_deleted"]),
        "doc_hash": result["doc_hash"],
    }


@router.post("/reload")
def reload_knowledge_base(force: bool = False):
    """Re-ingest knowledge base files without restarting the server.

    Normal mode (force=false): only ingests files not yet in the vector store.
    Force mode (force=true): re-ingests any file whose content hash has changed.
    """
    summary = load_knowledge_base(force=force)
    total_changed = len(summary["loaded"]) + len(summary["updated"])
    print(
        f"[knowledge-base] reload complete "
        f"loaded={len(summary['loaded'])} updated={len(summary['updated'])} "
        f"skipped={len(summary['skipped'])} force={force}"
    )
    return {
        "loaded": summary["loaded"],
        "updated": summary["updated"],
        "skipped": summary["skipped"],
        "total_changed": total_changed,
    }
