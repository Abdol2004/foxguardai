from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.ingest import ingest_file, ingest_url, ingest_text
from rag.query import query_knowledge

app = FastAPI(title="FoxGuard AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "foxguard-ai"}


# ─── Ingest ───────────────────────────────────────────────────────────────────

@app.post("/ingest/file")
async def ingest_file_endpoint(
    file: UploadFile = File(...),
    project_id: str = Form(...),
):
    content = await file.read()
    chunks = await ingest_file(project_id, file.filename or "upload", content)
    return {"status": "ok", "chunks_ingested": chunks, "filename": file.filename}


class UrlIngestRequest(BaseModel):
    url: str
    project_id: str


@app.post("/ingest/url")
async def ingest_url_endpoint(req: UrlIngestRequest):
    try:
        chunks = await ingest_url(req.project_id, req.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "ok", "chunks_ingested": chunks, "url": req.url}


class TextIngestRequest(BaseModel):
    text: str
    project_id: str


@app.post("/ingest/text")
async def ingest_text_endpoint(req: TextIngestRequest):
    chunks = await ingest_text(req.project_id, req.text)
    return {"status": "ok", "chunks_ingested": chunks}


# ─── Query ────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    project_id: str
    question: str
    language: str = "en"


@app.post("/query")
async def query_endpoint(req: QueryRequest):
    result = await query_knowledge(req.project_id, req.question, req.language)
    return result
