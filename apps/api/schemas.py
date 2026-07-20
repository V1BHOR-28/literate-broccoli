"""Pydantic V2 models mirroring ``packages/shared/types/api.ts``.

Field names are written in snake_case (Python idiom) but a ``to_camel`` alias
generator exposes them as camelCase over the wire, so the API JSON matches the
TypeScript interfaces exactly. ``populate_by_name=True`` lets internal callers
construct models with the snake_case field names directly.

Field types are chosen so that values returned by psycopg2 (``uuid.UUID``,
``decimal.Decimal``, ``datetime.datetime``) serialize to the shapes declared in
``api.ts`` (string ids, numeric values, ISO-8601 timestamps):
    * ``uuid.UUID``  -> JSON string
    * ``float``      -> JSON number (coerces incoming ``decimal.Decimal``)
    * ``datetime``   -> ISO-8601 string
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

KpiFrequency = Literal["daily", "weekly", "monthly"]
MemorySourceType = Literal["project", "kpi", "chat"]


class CamelModel(BaseModel):
    """Base model: snake_case fields, camelCase JSON aliases."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# --- Entities (response shapes) ---------------------------------------------

class Project(CamelModel):
    """Mirrors the ``Project`` TypeScript interface."""

    id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class KpiHistory(CamelModel):
    """Mirrors the ``KpiHistory`` TypeScript interface."""

    id: UUID
    kpi_id: UUID
    old_value: float
    new_value: float
    changed_by: str
    change_reason: str
    changed_at: datetime


class Kpi(CamelModel):
    """Mirrors the ``Kpi`` TypeScript interface."""

    id: UUID
    project_id: UUID
    name: str
    target_value: float
    current_value: float
    unit: Optional[str] = None
    frequency: KpiFrequency
    created_at: datetime
    updated_at: datetime
    history: list[KpiHistory] = Field(default_factory=list)


class MemoryVector(CamelModel):
    """Mirrors the ``MemoryVector`` TypeScript interface.

    The ``embedding`` column is ``vector(1536)`` in Postgres; over the wire it
    is a plain JSON array of floats.
    """

    id: UUID
    source_type: MemorySourceType
    source_id: UUID
    content_text: str
    embedding: list[float]
    created_at: datetime


# --- Request bodies ---------------------------------------------------------

class CreateProjectRequest(CamelModel):
    """Mirrors ``CreateProjectRequest``."""

    name: str
    description: Optional[str] = None


class CreateKpiRequest(CamelModel):
    """Mirrors ``CreateKpiRequest``."""

    name: str
    target_value: float
    current_value: float
    unit: Optional[str] = None
    frequency: KpiFrequency


class UpdateKpiValueRequest(CamelModel):
    """Mirrors ``UpdateKpiValueRequest``.

    The ``change_reason`` is mandatory here and enforced again by the
    ``kpi_history.change_reason`` CHECK constraint — this is a memory-critical
    constraint from AGENTS.md.
    """

    current_value: float
    changed_by: str
    change_reason: str = Field(min_length=1)
