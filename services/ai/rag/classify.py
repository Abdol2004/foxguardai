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
- toxic     → threats, hate speech, scams, harassment
- general   → normal chat, opinions, reactions, memes

One word:""",
)

# ─── Social prompt (no project context — for general/off-project questions) ───

SOCIAL_PROMPT = PromptTemplate(
    input_variables=["message", "sender"],
    template="""You are a fun, friendly community manager in a Telegram group.
The user is asking about a general topic — NOT about the project.
Just answer like a normal, social human friend. Be warm, engaging, and brief (1-3 sentences).
You can have opinions. You can recommend things. Be real.

{sender} says: "{message}"

Reply:""",
)

# ─── Project prompt (used when knowledge base has relevant content) ───────────

PROJECT_PROMPT = PromptTemplate(
    input_variables=["project_name", "message", "project_knowledge", "sender"],
    template="""You are the community manager for {project_name}.

Answer the question using the knowledge base below.
If the answer is not in the knowledge base, say: "I don't have that info yet — check our official docs or ask an admin."
NEVER invent contract addresses, token supply, APY, or dates.
Keep it SHORT (1-3 sentences). Sound human, not robotic.

{project_name} knowledge base:
{project_knowledge}

{sender} asks: "{message}"

Reply:""",
)

# ─── Crypto education prompt (general crypto — no project context needed) ─────

CRYPTO_PROMPT = PromptTemplate(
    input_variables=["message", "project_name", "sender"],
    template="""You are a knowledgeable, friendly crypto community manager.
Answer this general crypto question clearly and briefly (1-3 sentences).

Facts to apply when relevant:
- CEXes (Binance, Bybit, Coinbase, OKX) do NOT have contract addresses — they are platforms
- EVM tokens have 0x contract addresses, Solana tokens have base58 addresses
- Crypto = native coins on their own blockchain (BTC, ETH). Tokens = built on existing blockchains (ERC-20, BEP-20)
- Rug pull = devs abandon project and take funds. DYOR always.

{sender} asks: "{message}"

Reply:""",
)

# ─── Toxic detection ──────────────────────────────────────────────────────────

TOXIC_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this Telegram message genuinely harmful? (threats, hate speech, scam links, severe harassment)
Normal criticism, price questions, or complaints are NOT toxic.
Message: "{message}"
YES or NO only:""",
)

# ─── Is this crypto-related? ─────────────────────────────────────────────────

CRYPTO_CHECK_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this message asking about crypto, blockchain, DeFi, tokens, NFTs, Web3, or anything finance/tech related?
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


async def is_crypto_question(message: str) -> bool:
    chain = CRYPTO_CHECK_PROMPT | get_llm() | StrOutputParser()
    result = await chain.ainvoke({"message": message})
    return result.strip().upper().startswith("YES")


async def generate_response(
    message: str,
    message_type: str,
    project_name: str = "this project",
    project_knowledge: str = "",
    sender: str = "User",
) -> str:
    llm = get_llm()

    # Has relevant project knowledge → use project prompt
    if project_knowledge:
        chain = PROJECT_PROMPT | llm | StrOutputParser()
        return await chain.ainvoke({
            "project_name":      project_name,
            "message":           message,
            "project_knowledge": project_knowledge,
            "sender":            sender,
        })

    # No project knowledge — check if it's a crypto question
    if message_type == "question":
        crypto = await is_crypto_question(message)
        if crypto:
            chain = CRYPTO_PROMPT | llm | StrOutputParser()
            return await chain.ainvoke({
                "message":      message,
                "project_name": project_name,
                "sender":       sender,
            })

    # General social topic — just be human
    chain = SOCIAL_PROMPT | llm | StrOutputParser()
    return await chain.ainvoke({"message": message, "sender": sender})
