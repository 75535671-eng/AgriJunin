from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.core.database import test_connection
from app.core.responses import fail

@asynccontextmanager
async def lifespan(_app: FastAPI):
    if test_connection():
        print("[OK] Conexion MySQL establecida")
    else:
        print("[WARN] No se pudo conectar a MySQL")
    print(f"[OK] API FastAPI en http://localhost:{settings.port}/api")
    yield


app = FastAPI(
    title="AgriJunín API",
    description="Sistema Web de Agricultura Inteligente — Región Junín",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        settings.cors_origin,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return fail(detail, exc.status_code)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return fail(str(exc) if settings.env == "development" else "Error interno del servidor", 500)


@app.get("/api/health")
async def health() -> JSONResponse:
    from app.core.responses import success

    db_ok = test_connection()
    return success({"status": "ok", "database": db_ok, "framework": "FastAPI"})


app.include_router(api_router, prefix="/api")
