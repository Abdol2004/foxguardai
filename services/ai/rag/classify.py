from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from rag.llm import get_llm

# ─── Classification ───────────────────────────────────────────────────────────

CLASSIFY_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Classify this Telegram group message. Reply with ONLY one word.

Message: "{message}"

Categories:
- greeting  → hi, hello, hey, gm, good morning, yo, sup, welcome back
- question  → asking for info, help, how-to, what is, when, why
- toxic     → hostile, threatening, offensive, FUD, scam, harassment, spam
- offtopic  → asking about a different project, competitor, or unrelated topic
- general   → normal chat, opinions, reactions, memes

One word only:""",
)

# ─── Response generation ──────────────────────────────────────────────────────

RESPOND_PROMPT = PromptTemplate(
    input_variables=["project_name", "message", "message_type", "project_knowledge", "sender"],
    template="""You are the AI community manager for {project_name}.

STRICT RULES:
1. You ONLY discuss {project_name}. If someone asks about another project, competitor, or unrelated topic, say: "I only manage {project_name} here. For other projects please check their official channels."
2. NEVER make up information. If you don't have it in your knowledge base, say: "I don't have that info yet — check our official docs or ask an admin."
3. Keep replies SHORT — 1 to 3 sentences max. Sound human, not robotic.
4. Be warm, helpful, and professional.

Crypto knowledge (apply when relevant):
- Centralized exchanges (CEX) like Binance, Bybit, Coinbase, OKX do NOT have contract addresses — they are platforms, not tokens
- DeFi protocols, meme coins, and ERC-20/BEP-20 tokens DO have contract addresses
- Never invent contract addresses, wallet addresses, or token amounts
- Never invent APY%, token supply numbers, or roadmap dates you don't know
- If {project_name} is a CEX and someone asks for a "contract address" — explain that CEXes don't have contract addresses and point them to the official site
- For staking, trading, or platform fees — only state what is in the knowledge base

{project_name} knowledge base:
{project_knowledge}

---
{sender} says: "{message}"
Message type: {message_type}

Reply as {project_name} community manager:""",
)

# ─── Toxic detection ──────────────────────────────────────────────────────────

TOXIC_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this Telegram message harmful to a community? Consider: threats, hate speech, scam attempts, severe harassment, explicit FUD intended to harm.

Normal criticism or questions are NOT toxic.

Message: "{message}"

Answer YES or NO only:""",
)

# ─── Off-topic detection ──────────────────────────────────────────────────────

OFFTOPIC_PROMPT = PromptTemplate(
    input_variables=["message", "project_name", "project_knowledge"],
    template="""Is this message asking about something unrelated to {project_name}?

{project_name} knowledge summary: {project_knowledge}

Message: "{message}"

If the message is about a competing project, a different platform, or has no connection to {project_name}, answer YES.
If it could be relevant to {project_name}, answer NO.

Answer YES or NO only:""",
)


async def classify_message(message: str) -> str:
    chain = CLASSIFY_PROMPT | get_llm() | StrOutputParser()
    result = await chain.ainvoke({"message": message})
    result = result.strip().lower().split()[0] if result.strip() else "general"
    if result not in ("greeting", "question", "toxic", "offtopic", "general"):
        return "general"
    return result


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
        "message":          message,
        "message_type":     message_type,
        "project_name":     project_name,
        "project_knowledge": project_knowledge or "No knowledge base loaded yet.",
        "sender":           sender,
    })
