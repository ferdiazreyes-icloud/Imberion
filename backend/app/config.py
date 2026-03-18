from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://localhost:5432/imberion"
    cors_origins: List[str] = ["http://localhost:3000"]
    app_name: str = "USG Pricing Decision Engine"
    debug: bool = False
    port: int = 8000

    model_config = {"env_file": ".env"}


settings = Settings()
