from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def success(data: Any = None, message: str = "Operación exitosa", status: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content=jsonable_encoder({"success": True, "message": message, "data": data}),
    )


def paginated(data: list[Any], pagination: dict[str, Any], message: str = "Datos obtenidos") -> JSONResponse:
    return JSONResponse(
        status_code=200,
        content=jsonable_encoder(
            {"success": True, "message": message, "data": data, "pagination": pagination}
        ),
    )


def fail(message: str = "Error interno", status: int = 500, errors: Any = None) -> JSONResponse:
    body: dict[str, Any] = {"success": False, "message": message}
    if errors is not None:
        body["errors"] = errors
    return JSONResponse(status_code=status, content=body)


def http_error(message: str, status: int = 400) -> HTTPException:
    return HTTPException(status_code=status, detail=message)
