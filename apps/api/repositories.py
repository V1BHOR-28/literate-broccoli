"""Data-access layer: explicit-column SQL + row -> Pydantic mappers.

Every query lists columns explicitly (no ``SELECT *`` — AGENTS.md). Row dicts
returned by :class:`~psycopg2.extras.RealDictCursor` are validated into the
Pydantic response models via ``Model.model_validate(dict)``.
"""
from __future__ import annotations

from uuid import UUID

from db import get_cursor
from schemas import (
    CreateKpiRequest,
    CreateProjectRequest,
    Kpi,
    KpiHistory,
    Project,
)
from errors import NotFoundError
from memory_service import (
    build_kpi_history_text,
    build_kpi_text,
    build_project_text,
    enqueue_embedding_job,
)

# Column lists kept in one place so INSERT and SELECT stay in sync.

_PROJECT_COLUMNS = (
    "id",
    "name",
    "description",
    "created_at",
    "updated_at",
)
_PROJECT_SELECT = (
    "SELECT id, name, description, created_at, updated_at FROM projects"
)

_KPI_COLUMNS = (
    "id",
    "project_id",
    "name",
    "target_value",
    "current_value",
    "unit",
    "frequency",
    "created_at",
    "updated_at",
)
_KPI_SELECT = (
    "SELECT id, project_id, name, target_value, current_value, unit, "
    "frequency, created_at, updated_at FROM kpis"
)

_HISTORY_COLUMNS = (
    "id",
    "kpi_id",
    "old_value",
    "new_value",
    "changed_by",
    "change_reason",
    "changed_at",
)
_HISTORY_SELECT = (
    "SELECT id, kpi_id, old_value, new_value, changed_by, change_reason, "
    "changed_at FROM kpi_history"
)


# --- Projects ---------------------------------------------------------------

def list_projects() -> list[Project]:
    """Return all projects, newest first."""
    with get_cursor() as cur:
        cur.execute(f"{_PROJECT_SELECT} ORDER BY created_at DESC;")
        rows = cur.fetchall()
    return [Project.model_validate(dict(row)) for row in rows]


def create_project(payload: CreateProjectRequest) -> Project:
    """Insert a project and return the persisted row."""
    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO projects (name, description)
            VALUES (%(name)s, %(description)s)
            RETURNING id, name, description, created_at, updated_at;
            """,
            {"name": payload.name, "description": payload.description},
        )
        row = cur.fetchone()
        project = Project.model_validate(dict(row))
        enqueue_embedding_job(
            cur,
            project_id=project.id,
            source_type="project",
            source_id=project.id,
            kind="project",
            content_text=build_project_text(name=project.name, description=project.description),
        )
    return project


def project_exists(project_id: UUID) -> bool:
    """Return True if a project row exists for the given id."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT 1 FROM projects WHERE id = %s;",
            (project_id,),
        )
        return cur.fetchone() is not None


# --- KPIs -------------------------------------------------------------------

def list_kpis(project_id: UUID) -> list[Kpi]:
    """Return all KPIs for a project, each with its full history attached."""
    with get_cursor() as cur:
        cur.execute(
            f"{_KPI_SELECT} WHERE project_id = %(pid)s ORDER BY created_at DESC;",
            {"pid": project_id},
        )
        kpi_rows = cur.fetchall()
        if not kpi_rows:
            return []
        cur.execute(
            f"{_HISTORY_SELECT} WHERE kpi_id = ANY(%(ids)s) "
            "ORDER BY changed_at DESC;",
            {"ids": [row["id"] for row in kpi_rows]},
        )
        history_rows = cur.fetchall()

    histories: dict[UUID, list[KpiHistory]] = {}
    for row in history_rows:
        histories.setdefault(row["kpi_id"], []).append(
            KpiHistory.model_validate(dict(row))
        )
    return [
        Kpi.model_validate({**dict(row), "history": histories.get(row["id"], [])})
        for row in kpi_rows
    ]


def create_kpi(project_id: UUID, payload: CreateKpiRequest) -> Kpi:
    """Insert a KPI for the given project and return the persisted row."""
    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO kpis
                (project_id, name, target_value, current_value, unit, frequency)
            VALUES
                (%(project_id)s, %(name)s, %(target_value)s,
                 %(current_value)s, %(unit)s, %(frequency)s)
            RETURNING id, project_id, name, target_value, current_value, unit,
                      frequency, created_at, updated_at;
            """,
            {
                "project_id": project_id,
                "name": payload.name,
                "target_value": payload.target_value,
                "current_value": payload.current_value,
                "unit": payload.unit,
                "frequency": payload.frequency,
            },
        )
        row = cur.fetchone()
        cur.execute("SELECT name FROM projects WHERE id = %s;", (project_id,))
        project_row = cur.fetchone()
        kpi = Kpi.model_validate({**dict(row), "history": []})
        enqueue_embedding_job(
            cur,
            project_id=project_id,
            source_type="kpi",
            source_id=kpi.id,
            kind="kpi_definition",
            content_text=build_kpi_text(
                project_name=project_row["name"], name=kpi.name,
                target_value=kpi.target_value, unit=kpi.unit, frequency=kpi.frequency,
            ),
            metadata={"kpi_id": str(kpi.id)},
        )
    return kpi


def get_kpi(kpi_id: UUID) -> Kpi:
    """Return a single KPI with its history, or raise :class:`NotFoundError`."""
    with get_cursor() as cur:
        cur.execute(f"{_KPI_SELECT} WHERE id = %s;", (kpi_id,))
        kpi_row = cur.fetchone()
        if kpi_row is None:
            raise NotFoundError("kpi", kpi_id)
        cur.execute(
            f"{_HISTORY_SELECT} WHERE kpi_id = %s ORDER BY changed_at DESC;",
            (kpi_id,),
        )
        history_rows = cur.fetchall()
    return Kpi.model_validate(
        {**dict(kpi_row), "history": [dict(r) for r in history_rows]}
    )


def update_kpi_value(
    kpi_id: UUID,
    new_value: float,
    changed_by: str,
    change_reason: str,
) -> Kpi:
    """Update a KPI's current value and append a kpi_history row.

    Both writes run in a single transaction so the audit trail can never be
    lost relative to the value change (AGENTS.md memory-critical constraint).
    The CHECK constraint on ``kpi_history.change_reason`` and the
    ``min_length=1`` Pydantic rule both guarantee a non-empty reason.
    """
    with get_cursor(commit=True) as cur:
        # Lock + read old value so concurrent updaters cannot race the audit.
        cur.execute(
            """
            SELECT id, project_id, name, unit, current_value
            FROM kpis WHERE id = %s FOR UPDATE;
            """,
            (kpi_id,),
        )
        current = cur.fetchone()
        if current is None:
            raise NotFoundError("kpi", kpi_id)
        old_value = current["current_value"]

        cur.execute(
            """
            UPDATE kpis
               SET current_value = %(new_value)s, updated_at = now()
             WHERE id = %(kpi_id)s
            RETURNING id, project_id, name, target_value, current_value, unit,
                      frequency, created_at, updated_at;
            """,
            {"kpi_id": kpi_id, "new_value": new_value},
        )
        kpi_row = cur.fetchone()

        cur.execute(
            """
            INSERT INTO kpi_history
                (kpi_id, old_value, new_value, changed_by, change_reason)
            VALUES
                (%(kpi_id)s, %(old_value)s, %(new_value)s,
                 %(changed_by)s, %(change_reason)s)
            RETURNING id, kpi_id, old_value, new_value, changed_by,
                      change_reason, changed_at;
            """,
            {
                "kpi_id": kpi_id,
                "old_value": old_value,
                "new_value": new_value,
                "changed_by": changed_by,
                "change_reason": change_reason,
            },
        )
        history_row = cur.fetchone()
        cur.execute("SELECT name FROM projects WHERE id = %s;", (kpi_row["project_id"],))
        project_row = cur.fetchone()
        enqueue_embedding_job(
            cur,
            project_id=kpi_row["project_id"],
            source_type="kpi_history",
            source_id=history_row["id"],
            kind="kpi_change",
            content_text=build_kpi_history_text(
                project_name=project_row["name"], kpi_name=kpi_row["name"],
                old_value=old_value, new_value=new_value, unit=kpi_row["unit"],
                changed_by=changed_by, change_reason=change_reason,
                changed_at=history_row["changed_at"],
            ),
            metadata={"kpi_id": str(kpi_id), "changed_by": changed_by},
        )

    return Kpi.model_validate(
        {**dict(kpi_row), "history": [dict(history_row)]}
    )
