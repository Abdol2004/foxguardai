from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from rag.vectorstore import get_vectorstore
from rag.llm import get_llm
from config import settings

PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are Sentinel Fox, an AI community manager for a Web3 project on Telegram.
Answer community members' questions clearly and accurately based on the project documentation.
Be concise, friendly, and helpful. If the answer isn't in the context, say you're not sure.

Context:
{context}

Question: {question}

Answer:""",
)


def _format_docs(docs):
    return "\n\n".join(d.page_content for d in docs)


async def query_knowledge(project_id: str, question: str, language: str = "en") -> dict:
    vs = get_vectorstore(project_id)
    retriever = vs.as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.top_k},
    )

    docs = retriever.invoke(question)
    if not docs:
        return {
            "answer": "I don't have information about that yet. Please ask an admin.",
            "confidence": 0.0,
            "sources": [],
            "escalate": True,
        }

    confidence = 0.75 if len(docs) >= 3 else 0.5

    chain = (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | PROMPT
        | get_llm()
        | StrOutputParser()
    )

    answer = chain.invoke(question)
    sources = list({d.metadata.get("source", "") for d in docs})
    escalate = confidence < settings.confidence_threshold or not answer.strip()

    return {
        "answer": answer,
        "confidence": confidence,
        "sources": sources,
        "escalate": escalate,
    }
