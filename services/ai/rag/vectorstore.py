from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from rag.embeddings import get_embeddings
from config import settings

_pc: Pinecone | None = None
_index_ready = False


def get_pinecone() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


def ensure_index():
    """Create the Pinecone index if it doesn't exist yet."""
    global _index_ready
    if _index_ready:
        return
    pc = get_pinecone()
    existing = [idx.name for idx in pc.list_indexes()]
    if settings.pinecone_index_name not in existing:
        print(f"[Pinecone] Creating index '{settings.pinecone_index_name}' (dim=384, cosine)...")
        pc.create_index(
            name=settings.pinecone_index_name,
            dimension=384,          # BAAI/bge-small-en-v1.5
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print("[Pinecone] Index created.")
    else:
        print(f"[Pinecone] Index '{settings.pinecone_index_name}' already exists.")
    _index_ready = True


def get_vectorstore(namespace: str) -> PineconeVectorStore:
    ensure_index()
    index = get_pinecone().Index(settings.pinecone_index_name)
    return PineconeVectorStore(
        index=index,
        embedding=get_embeddings(),
        namespace=namespace,
    )
