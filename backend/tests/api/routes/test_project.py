from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import Project, User


def test_create_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    data = {"name": "My Draft Project"}
    response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert "project_id" in content

    user = db.exec(select(User).where(User.email == settings.EMAIL_TEST_USER)).first()
    assert user is not None

    created_project = db.get(Project, content["project_id"])
    assert created_project is not None
    assert created_project.owner_id == user.id
    assert created_project.name == data["name"]
    assert created_project.status == "draft"
    assert created_project.current_version == 0
