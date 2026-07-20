"""Typed API errors and FastAPI exception handlers.

Centralising error handling keeps the route layer declarative: a repository
raises :class:`NotFoundError`, and the corresponding HTTP 404 is produced here.
"""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    """Raised when a referenced resource does not exist in the database."""

    def __init__(self, resource: str, resource_id: Any) -> None:
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(f"{resource} {resource_id} not found")


def register_exception_handlers(app: FastAPI) -> None:
    """Register the global JSON exception handlers on the FastAPI app."""

    @app.exception_handler(NotFoundError)
    async def _not_found_handler(_: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "error": "not_found",
                "message": f"{exc.resource} '{exc.resource_id}' not found",
            },
        )

    @app.exception_handler(ValueError)
    async def _value_error_handler(_: Request, exc: ValueError) -> JSONResponse:
        # Covers malformed UUIDs in path parameters.
        return JSONResponse(
            status_code=400,
            content={"error": "bad_request", "message": str(exc)},
        )
