from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from rag.embeddings import get_embeddings
from config import settings

_pc: Pinecone | None = None


def get_pinecone() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


def get_vectorstore(namespace: str) -> PineconeVectorStore:
    index = get_pinecone().Index(settings.pinecone_index_name)
    return PineconeVectorStore(
        index=index,
        embedding=get_embeddings(),
        namespace=namespace,
    )
