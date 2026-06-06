import chromadb

# One persistent client shared across the app — data survives restarts
_client = chromadb.PersistentClient(path="data/chroma")


def get_collection(name: str) -> chromadb.Collection:
    # get_or_create means it's safe to call this multiple times without error
    return _client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},  # cosine similarity for semantic search
    )


def add_documents(
    collection: chromadb.Collection,
    texts: list[str],
    embeddings: list[list[float]],
    ids: list[str],
) -> None:
    collection.add(
        documents=texts,
        embeddings=embeddings,
        ids=ids,
    )


def query_collection(
    collection: chromadb.Collection,
    query_embedding: list[float],
    n_results: int = 5,
) -> tuple[list[str], list[float]]:
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "distances"],
    )
    return results["documents"][0], results["distances"][0]
