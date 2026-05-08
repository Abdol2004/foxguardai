from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongodb_uri: str = "mongodb://localhost:27017/foxguard"
    mongodb_db: str = "foxguard"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    chat_model: str = "deepseek-chat"

    pinecone_api_key: str = ""
    pinecone_index_name: str = "foxguard-knowledge"

    embed_model: str = "BAAI/bge-small-en-v1.5"   # local fastembed model
    chunk_size: int = 800
    chunk_overlap: int = 100
    top_k: int = 5
    confidence_threshold: float = 0.4


settings = Settings()
