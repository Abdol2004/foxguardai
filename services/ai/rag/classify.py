from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from rag.llm import get_llm

CLASSIFY_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Classify this Telegram group message into exactly one category.

Message: "{message}"

Categories:
- greeting: casual hello, hi, hey, gm, good morning, sup, yo, wassup, howdy, welcome
- question: asking for information, help, or clarification (has ? or question intent)
- toxic: hostile, offensive, threatening, harassing, spreading FUD, scam attempt, aggressive
- general: normal conversation, opinions, sharing news, reactions

Reply with ONLY the category word. Nothing else.""",
)

RESPOND_PROMPT = PromptTemplate(
    input_variables=["context", "message", "message_type", "project_knowledge"],
    template="""You are a friendly, knowledgeable community manager for a Web3 project on Telegram.
You are helpful, warm, and professional. You sound like a real human — not a bot.
Keep replies short (1-3 sentences max). Be engaging and natural.

Project knowledge:
{project_knowledge}

Message type: {message_type}
Message: "{message}"

Guidelines:
- For greetings: respond warmly and invite engagement
- For questions: answer from project knowledge if possible, otherwise give helpful guidance
- For general chat: engage naturally, be encouraging
- Never mention you are an AI unless directly asked
- Use casual language appropriate for crypto/Web3 communities

Reply:""",
)

TOXIC_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this Telegram message toxic, hostile, offensive, threatening, or spreading FUD/scams?

Message: "{message}"

Reply with only: YES or NO""",
)


async def classify_message(message: str) -> str:
    chain = CLASSIFY_PROMPT | get_llm() | StrOutputParser()
    result = await chain.ainvoke({"message": message})
    result = result.strip().lower()
    if result not in ("greeting", "question", "toxic", "general"):
        return "general"
    return result


async def check_toxic(message: str) -> bool:
    chain = TOXIC_PROMPT | get_llm() | StrOutputParser()
    result = await chain.ainvoke({"message": message})
    return result.strip().upper().startswith("YES")


async def generate_response(
    message: str,
    message_type: str,
    project_knowledge: str = "",
    context: str = "",
) -> str:
    chain = RESPOND_PROMPT | get_llm() | StrOutputParser()
    return await chain.ainvoke({
        "message": message,
        "message_type": message_type,
        "project_knowledge": project_knowledge,
        "context": context,
    })
