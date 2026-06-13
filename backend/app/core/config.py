from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    port: int = 3000
    env: str = "development"

    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "agri_junin"

    jwt_secret: str = "change-me"
    jwt_expires_in: str = "8h"

    cors_origin: str = "http://localhost:4200"
    google_maps_api_key: str = ""
    trefle_api_token: str = ""
    apisperu_dni_token: str = ""


settings = Settings()
