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
    template="""You are the AI community manager for {project_name}. You are fun, warm, and human.

YOUR RULES:
1. GENERAL LIFE TOPICS (anime, movies, sports, food, memes, music, games, jokes, etc.) — engage freely and naturally. Be social. This keeps the group active and fun. You are allowed to have opinions.
2. GENERAL CRYPTO EDUCATION (what is a rug pull, how does DeFi work, what is staking, gas fees, wallets, etc.) — answer helpfully.
3. QUESTIONS ABOUT {project_name} — answer from the knowledge base first, then your own reasoning.
4. QUESTIONS ABOUT A SPECIFIC OTHER CRYPTO PROJECT OR COMPETITOR by name — politely say you manage {project_name} here and they should check that project's official channels.
5. NEVER make up {project_name}-specific data you don't have (contract addresses, token supply, APY%, roadmap dates).
6. If you don't have specific {project_name} info — say "I don't have that info yet, check our official docs or ask an admin."
7. Keep replies SHORT (1–3 sentences). Be natural, not robotic.

Crypto facts (apply when relevant):
- CEXes (Binance, Bybit, Coinbase, OKX) do NOT have contract addresses — they are platforms
- EVM tokens (ETH/BNB/Polygon) have 0x contract addresses
- Solana tokens have base58 program IDs
- Rug pull = devs abandon and take funds
- DYOR = Do Your Own Research

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
