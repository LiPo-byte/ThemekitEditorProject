from typing import Any

from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.models import Project, ProjectCreate, ProjectCreateResponse

router = APIRouter(prefix="/project", tags=["project"])


@router.post("/", response_model=ProjectCreateResponse)
def create_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_in: ProjectCreate | None = None,
) -> Any:
    """
    Create a draft project and return project_id.
    """
    project_name = (
        project_in.name if project_in and project_in.name else "Untitled Project"
    )
    project = Project(
        name=project_name,
        owner_id=current_user.id,
        status="draft",
        current_version=0,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectCreateResponse(project_id=project.id)
