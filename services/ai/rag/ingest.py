import os
import tempfile
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_core.documents import Document

from rag.vectorstore import get_vectorstore
from config import settings


def _splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )


async def ingest_file(project_id: str, filename: str, content: bytes) -> int:
    suffix = Path(filename).suffix.lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if suffix == ".pdf":
            loader = PyPDFLoader(tmp_path)
        elif suffix in (".docx", ".doc"):
            loader = Docx2txtLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path, encoding="utf-8")
        docs = loader.load()
    finally:
        os.unlink(tmp_path)

    chunks = _splitter().split_documents(docs)
    for chunk in chunks:
        chunk.metadata["project_id"] = project_id
        chunk.metadata["source"] = filename

    vs = get_vectorstore(project_id)
    vs.add_documents(chunks)
    return len(chunks)


async def ingest_url(project_id: str, url: str) -> int:
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)

    docs = [Document(page_content=text, metadata={"project_id": project_id, "source": url})]
    chunks = _splitter().split_documents(docs)
    get_vectorstore(project_id).add_documents(chunks)
    return len(chunks)


async def ingest_text(project_id: str, text: str) -> int:
    docs = [Document(page_content=text, metadata={"project_id": project_id, "source": "manual"})]
    chunks = _splitter().split_documents(docs)
    get_vectorstore(project_id).add_documents(chunks)
    return len(chunks)
