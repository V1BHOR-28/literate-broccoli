"""Project routes — ``GET /projects`` and ``POST /projects``.

Both endpoints match the shapes declared in ``packages/shared/types/api.ts``:
camelCase JSON in and out. Responses are typed so FastAPI's OpenAPI schema and
the alias generator keep the casing contract.
"""
from __future__ import annotations

from fastapi import APIRouter, status

from repositories import create_project, list_projects, bulk_import
from schemas import CreateProjectRequest, Project, BulkImportRequest

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[Project])
def get_projects() -> list[Project]:
    """List all projects, newest first."""
    return list_projects()


@router.post(
    "",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
)
def post_projects(payload: CreateProjectRequest) -> Project:
    """Create a new project."""
    return create_project(payload)


@router.post(
    "/bulk-import",
    status_code=status.HTTP_200_OK,
)
def post_bulk_import(payload: BulkImportRequest) -> dict[str, int]:
    """Bulk import projects and KPIs from Excel data."""
    count = bulk_import(payload.items)
    return {"importedCount": count}
