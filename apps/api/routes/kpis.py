"""KPI routes.

* ``GET  /projects/{id}/kpis``  — list KPIs (with history) for a project
* ``POST /projects/{id}/kpis``  — create a KPI under a project
* ``PATCH /kpis/{id}/value``    — update a KPI value, writing a kpi_history row

The PATCH endpoint is memory-critical (AGENTS.md): every value change MUST be
recorded in ``kpi_history`` with ``changed_by`` and ``change_reason``. The
repository enforces this inside a single transaction.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, status

from errors import NotFoundError
from repositories import (
    create_kpi,
    list_kpis,
    project_exists,
    update_kpi_value,
)
from schemas import CreateKpiRequest, Kpi, UpdateKpiValueRequest

project_kpis_router = APIRouter(prefix="/projects", tags=["kpis"])
kpi_value_router = APIRouter(prefix="/kpis", tags=["kpis"])


@project_kpis_router.get("/{project_id}/kpis", response_model=list[Kpi])
def get_project_kpis(project_id: UUID) -> list[Kpi]:
    """List KPIs for a project, each carrying its history."""
    if not project_exists(project_id):
        raise NotFoundError("project", project_id)
    return list_kpis(project_id)


@project_kpis_router.post(
    "/{project_id}/kpis",
    response_model=Kpi,
    status_code=status.HTTP_201_CREATED,
)
def post_project_kpi(
    project_id: UUID, payload: CreateKpiRequest
) -> Kpi:
    """Create a KPI under a project."""
    if not project_exists(project_id):
        raise NotFoundError("project", project_id)
    return create_kpi(project_id, payload)


@kpi_value_router.patch("/{kpi_id}/value", response_model=Kpi)
def patch_kpi_value(kpi_id: UUID, payload: UpdateKpiValueRequest) -> Kpi:
    """Update a KPI's current value and append a kpi_history row.

    The response includes the newly-created ``kpi_history`` entry so callers
    can confirm the audit trail without a follow-up request.
    """
    return update_kpi_value(
        kpi_id=kpi_id,
        new_value=payload.current_value,
        changed_by=payload.changed_by,
        change_reason=payload.change_reason,
    )


__all__ = [
    "project_kpis_router",
    "kpi_value_router",
    "get_project_kpis",
    "post_project_kpi",
    "patch_kpi_value",
]
