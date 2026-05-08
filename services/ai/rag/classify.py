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
- general   → normal chat, opinions, reactions, jokes, sharing stuff

One word:""",
)

# ─── Social prompt — general life topics ─────────────────────────────────────

SOCIAL_PROMPT = PromptTemplate(
    input_variables=["message", "sender"],
    template="""You are a fun, friendly person chatting in a Telegram group. You also manage the community.

Someone said something or asked a casual question. Just respond like a normal human friend would.
Be warm, relatable, and short (1-3 sentences). You can have opinions and recommendations.

Rules:
- Do NOT mention the project or redirect to the project website
- Do NOT say you only handle project topics
- Just chat naturally
- No markdown: no **bold**, no *italic*, no bullet points with asterisks
- Plain text only

Examples of good replies:
- Asked about a movie → "Oh nice choice! Fire and Ash is actually pretty good, worth a watch this weekend."
- Asked weekend plans → "Honestly, a good movie and some food hits different on weekends. What vibe are you going for?"
- Asked about anime → "Attack on Titan is a must if you haven't seen it. What genre do you like?"

{sender} says: "{message}"

Reply (plain text, no formatting):""",
)

# ─── Project prompt — knowledge base answer ───────────────────────────────────

PROJECT_PROMPT = PromptTemplate(
    input_variables=["project_name", "message", "project_knowledge", "sender"],
    template="""You are the community manager for {project_name}.

Answer using the knowledge base below.
If the answer is not in the knowledge base, say: I don't have that info yet, check our official docs or ask an admin.
Never invent addresses, numbers, or dates.
Keep it short (1-3 sentences). Sound human and natural.

FORMATTING: Use plain text only. No asterisks, no markdown, no **bold**.

{project_name} knowledge base:
{project_knowledge}

{sender} asks: "{message}"

Reply:""",
)

# ─── Crypto education prompt ──────────────────────────────────────────────────

CRYPTO_PROMPT = PromptTemplate(
    input_variables=["message", "project_name", "sender"],
    template="""You are a knowledgeable, friendly crypto community manager.
Answer this general crypto question clearly and briefly (1-3 sentences).
Use plain text only. No asterisks, no markdown, no **bold** or *italic*.

Key facts:
- CEXes (Binance, Bybit, Coinbase, OKX) do NOT have contract addresses
- EVM tokens have 0x addresses, Solana tokens have base58 addresses
- Crypto = native coins (BTC, ETH). Tokens = built on existing blockchains
- Rug pull = devs abandon and take funds. Always DYOR.

{sender} asks: "{message}"

Reply (plain text only):""",
)

# ─── Toxic detection ──────────────────────────────────────────────────────────

TOXIC_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this Telegram message genuinely harmful? (threats, hate speech, scam links, severe harassment)
Normal questions, jokes, and casual chat are NOT toxic.
Message: "{message}"
YES or NO only:""",
)

# ─── Crypto check ─────────────────────────────────────────────────────────────

CRYPTO_CHECK_PROMPT = PromptTemplate(
    input_variables=["message"],
    template="""Is this message specifically about crypto, blockchain, DeFi, tokens, NFTs, or Web3 technology?
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

    # High-confidence project knowledge → use project prompt
    if project_knowledge:
        chain = PROJECT_PROMPT | llm | StrOutputParser()
        return await chain.ainvoke({
            "project_name":      project_name,
            "message":           message,
            "project_knowledge": project_knowledge,
            "sender":            sender,
        })

    # No project knowledge + crypto question → use crypto prompt
    if message_type == "question":
        crypto = await is_crypto_question(message)
        if crypto:
            chain = CRYPTO_PROMPT | llm | StrOutputParser()
            return await chain.ainvoke({
                "message":      message,
                "project_name": project_name,
                "sender":       sender,
            })

    # Everything else → social prompt (movies, anime, weekend, jokes, etc.)
    chain = SOCIAL_PROMPT | llm | StrOutputParser()
    return await chain.ainvoke({"message": message, "sender": sender})
