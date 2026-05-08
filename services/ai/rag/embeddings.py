from langchain_community.embeddings import FastEmbedEmbeddings
from config import settings

_embeddings: FastEmbedEmbeddings | None = None


def get_embeddings() -> FastEmbedEmbeddings:
    global _embeddings
    if _embeddings is None:
        # Downloads model on first run (~40MB), cached locally after that
        _embeddings = FastEmbedEmbeddings(model_name=settings.embed_model)
    return _embeddings
