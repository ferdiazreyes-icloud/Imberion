from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://imberion:dev_password@localhost:5432/imberion"
    cors_origins: list[str] = ["http://localhost:3000"]
    app_name: str = "USG Pricing Decision Engine"
    debug: bool = True

    model_config = {"env_file": ".env"}


settings = Settings()
