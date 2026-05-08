from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from rag.llm import get_llm

# ─── Classification ───────────────────────────────────────────────────────────

CLASSIFY_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Classify this Telegram message. Reply with ONE word only.

Message: "{message}"

Categories:
- greeting  → hi, hello, hey, gm, good morning, yo, sup, welcome
- question  → asking for information, help, explanation, or how-to
- toxic     → threats, hate speech, scams, harassment, severe FUD
- general   → normal conversation, opinions, reactions

One word:""",
)

# ─── Main response prompt ─────────────────────────────────────────────────────

RESPOND_PROMPT = PromptTemplate(
    input_variables=["project_name", "message", "message_type", "project_knowledge", "sender"],
    template="""You are a fun, warm, human community manager in a Telegram group. You also happen to manage {project_name}.

ABSOLUTE RULE #1 — READ THIS FIRST:
If the message is about movies, anime, TV shows, sports, music, food, memes, games, life, weekends, or ANY non-crypto general topic — just answer it like a normal human friend would. Recommend the movie. Talk about the anime. Share your opinion. Do NOT redirect to {project_name}. Do NOT say "I'm here to help with {project_name}". Just be human and social.

ABSOLUTE RULE #2:
Only redirect to {project_name} when someone asks specifically about a DIFFERENT named crypto project (e.g. "tell me about Uniswap" or "what is Binance's fee"). In that case say you manage {project_name} here.

RULE #3 — Project questions:
Use the knowledge base below to answer {project_name}-specific questions.
NEVER invent contract addresses, token supply, APY, or dates you don't know.
If not in knowledge base: "I don't have that info yet — check our official docs."

RULE #4 — General crypto:
Answer general crypto education questions freely (rug pulls, staking, DeFi, wallets, gas fees).

Keep replies SHORT (1–3 sentences max). Sound human, casual, real.

{project_name} knowledge base:
{project_knowledge}

---
{sender} says: "{message}"

Reply:""",
)

# ─── Toxic detection ──────────────────────────────────────────────────────────

TOXIC_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this Telegram message genuinely harmful? (threats, hate speech, scam links, severe harassment)

Normal criticism, price questions, FUD, or complaints are NOT toxic.

Message: "{message}"

YES or NO only:""",
)


async def classify_message(message: str) -> str:
    chain = CLASSIFY_PROMPT | get_llm() | StrOutputParser()
    result = await chain.ainvoke({"message": message})
    word = result.strip().lower().split()[0] if result.strip() else "general"
    if word not in ("greeting", "question", "toxic", "general"):
        return "general"
    return word


async def check_toxic(message: str) -> bool:
    chain = TOXIC_PROMPT | get_llm() | StrOutputParser()
    result = await chain.ainvoke({"message": message})
    return result.strip().upper().startswith("YES")


async def generate_response(
    message: str,
    message_type: str,
    project_name: str = "this project",
    project_knowledge: str = "",
    sender: str = "User",
) -> str:
    chain = RESPOND_PROMPT | get_llm() | StrOutputParser()
    return await chain.ainvoke({
        "message":           message,
        "message_type":      message_type,
        "project_name":      project_name,
        "project_knowledge": project_knowledge or "No knowledge base loaded yet. Tell users to check official docs.",
        "sender":            sender,
    })
