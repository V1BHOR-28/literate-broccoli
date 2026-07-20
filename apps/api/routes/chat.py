"""Project-scoped Jarvis chat endpoint."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from chat_service import answer_project_chat
from schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/projects", tags=["chat"])


@router.post("/{project_id}/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def post_project_chat(project_id: UUID, payload: ChatRequest) -> ChatResponse:
    """Answer a project question from live KPIs plus project-scoped historical memory."""
    try:
        return answer_project_chat(
            project_id=project_id, session_id=payload.session_id,
            message=payload.message, user=payload.user,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
