import os
from urllib.parse import urlparse

from pydantic import model_validator
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

    @model_validator(mode="after")
    def apply_platform_env(self) -> "Settings":
        mysql_url = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")
        if mysql_url and mysql_url.startswith("mysql"):
            parsed = urlparse(mysql_url)
            if parsed.hostname:
                self.db_host = parsed.hostname
            if parsed.port:
                self.db_port = parsed.port
            if parsed.username:
                self.db_user = parsed.username
            if parsed.password:
                self.db_password = parsed.password
            if parsed.path:
                self.db_name = parsed.path.lstrip("/")

        self.db_host = os.getenv("MYSQLHOST", self.db_host)
        self.db_port = int(os.getenv("MYSQLPORT", str(self.db_port)))
        self.db_user = os.getenv("MYSQLUSER", self.db_user)
        self.db_password = os.getenv("MYSQLPASSWORD", self.db_password)
        self.db_name = os.getenv("MYSQLDATABASE", self.db_name)

        railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
        if railway_domain and self.env == "production":
            self.cors_origin = f"https://{railway_domain}"

        return self


settings = Settings()
