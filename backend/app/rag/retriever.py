import time
from app.embeddings.embedder import embed_single
from app.vectorstore.chroma import get_collection, query_collection

KNOWLEDGE_BASE_COLLECTION = "knowledge_base"
RELEVANCE_THRESHOLD = 0.8


def retrieve_context(query: str, n_results: int = 6, trace=None) -> list[str]:
    t0 = time.perf_counter()
    span = trace.span(name="retrieval") if trace else None

    collection = get_collection(KNOWLEDGE_BASE_COLLECTION)
    query_embedding = embed_single(query)
    chunks, distances = query_collection(collection, query_embedding, n_results=n_results)

    filtered = [c for c, d in zip(chunks, distances) if d <= RELEVANCE_THRESHOLD]
    dropped = len(chunks) - len(filtered)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    if dropped:
        print(
            f"[guardrail] gate=retrieval reason=relevance_threshold "
            f"dropped={dropped} threshold={RELEVANCE_THRESHOLD}"
        )
    print(
        f"[retrieval] chunks={len(chunks)} kept={len(filtered)} "
        f"latency={elapsed_ms:.0f}ms"
    )

    if span:
        span.end(output={
            "chunks_retrieved": len(chunks),
            "chunks_after_threshold": len(filtered),
            "chunks_dropped": dropped,
        }, metadata={"latency_ms": round(elapsed_ms)})

    return filtered
