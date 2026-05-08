from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.ingest import ingest_file, ingest_url, ingest_text
from rag.query import query_knowledge
from rag.classify import classify_message, check_toxic, generate_response
from rag.embeddings import get_embeddings
from rag.vectorstore import get_vectorstore


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load embedding model on startup so first request doesn't time out
    print("[Startup] Loading embedding model...")
    get_embeddings()
    print("[Startup] Ready.")
    yield


app = FastAPI(title="FoxGuard AI Service", version="0.1.0", lifespan=lifespan)

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
    try:
        content = await file.read()
        chunks = await ingest_file(project_id, file.filename or "upload", content)
        return {"status": "ok", "chunks_ingested": chunks, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    try:
        chunks = await ingest_text(req.project_id, req.text)
        return {"status": "ok", "chunks_ingested": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Query ────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    project_id: str
    question: str
    language: str = "en"


@app.post("/query")
async def query_endpoint(req: QueryRequest):
    result = await query_knowledge(req.project_id, req.question, req.language)
    return result


# ─── Conversation (human-like, project-aware) ─────────────────────────────────

class ConversationRequest(BaseModel):
    project_id: str
    project_name: str = ""
    message: str
    sender_name: str = ""


@app.post("/conversation")
async def conversation_endpoint(req: ConversationRequest):
    message = req.message.strip()
    if not message:
        return {"reply": None, "action": "ignore"}

    project_name = req.project_name or req.project_id

    # Classify message
    msg_type = await classify_message(message)

    # Toxic check
    if msg_type == "toxic":
        is_toxic = await check_toxic(message)
        if is_toxic:
            return {"reply": None, "action": "warn", "reason": "Toxic content"}

    # Fetch project knowledge
    project_knowledge = ""
    try:
        vs = get_vectorstore(req.project_id)
        docs = vs.similarity_search(message, k=4)
        project_knowledge = "\n\n".join(d.page_content for d in docs)
    except Exception:
        pass

    reply = await generate_response(
        message=message,
        message_type=msg_type,
        project_name=project_name,
        project_knowledge=project_knowledge,
        sender=req.sender_name or "User",
    )

    return {"reply": reply.strip(), "action": "reply", "message_type": msg_type}


class ToxicCheckRequest(BaseModel):
    message: str


@app.post("/toxic-check")
async def toxic_check_endpoint(req: ToxicCheckRequest):
    is_toxic = await check_toxic(req.message)
    return {"is_toxic": is_toxic}
