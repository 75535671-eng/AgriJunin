from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


class LoginBody(BaseModel):
    password: str = Field(min_length=6)
    dni: str | None = Field(default=None, pattern=r"^\d{8}$")
    email: EmailStr | None = None
    login: str | None = None

    @model_validator(mode="after")
    def require_identifier(self) -> LoginBody:
        if not (self.dni or self.email or self.login):
            raise ValueError("Ingrese DNI o correo electrónico")
        return self


class RegisterBody(BaseModel):
    dni: str = Field(pattern=r"^\d{8}$")
    email: EmailStr
    password: str = Field(min_length=8)
    nombres: str | None = None
    apellidos: str | None = None
    nombre: str | None = None
    rol: Literal["agricultor", "tecnico"] | None = "agricultor"
    distrito: str | None = None


class RejectBody(BaseModel):
    motivo: str | None = Field(default=None, max_length=255)
