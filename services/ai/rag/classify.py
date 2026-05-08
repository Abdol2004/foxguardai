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
    template="""You are the AI community manager for {project_name}.

YOUR RULES:
1. If asked specifically about a DIFFERENT NAMED project (e.g. "tell me about Binance" when you manage a different project) — say: "I manage {project_name} here, not [that project]. Check their official channels."
2. General crypto/blockchain questions (what is a meme coin, how does Solana work, what is a rug pull, gas fees, etc.) — answer them helpfully and briefly.
3. Questions about the chain {project_name} runs on (Solana, BNB, Ethereum, etc.) — answer them since they're relevant to users.
4. NEVER make up contract addresses, wallet addresses, token amounts, APY%, or dates you don't have.
5. If you don't know something specific about {project_name} — say: "I don't have that info yet — check our official docs or ask an admin."
6. Keep replies SHORT (1–3 sentences). Sound human and natural, not robotic.

Crypto facts (use when relevant):
- CEXes (Binance, Bybit, Coinbase, OKX, Kraken) are platforms — they do NOT have contract addresses
- Tokens/coins on EVM chains (ETH, BNB, Polygon) have contract addresses starting with 0x
- Solana tokens have contract addresses (program IDs) that look like random base58 strings
- "Contract address" and "token address" are the same thing for ERC-20/BEP-20 tokens
- A meme coin IS a crypto token — it CAN have a contract address on its chain
- Rug pull = dev abandons project and takes funds. Always remind users to verify contracts on official channels.
- DYOR = Do Your Own Research. Always encourage it.

{project_name} knowledge base:
{project_knowledge}

---
{sender} says: "{message}"

Reply as {project_name} community manager:""",
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
