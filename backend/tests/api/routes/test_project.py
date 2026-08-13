import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import ElementConfig, Project, ProjectElement, User


def test_get_project_list_for_owner(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    own_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Owner List Project"},
    )
    assert own_response.status_code == 200
    own_project_id = own_response.json()["project_id"]

    to_delete_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Owner Deleted Project"},
    )
    assert to_delete_response.status_code == 200
    deleted_project_id = to_delete_response.json()["project_id"]
    deleted_project = db.get(Project, deleted_project_id)
    assert deleted_project is not None
    deleted_project.deleted_at = datetime.now(timezone.utc)
    db.add(deleted_project)
    db.commit()

    other_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
        json={"name": "Other User Project"},
    )
    assert other_response.status_code == 200

    list_response = client.get(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
    )
    assert list_response.status_code == 200
    content = list_response.json()
    assert content["count"] >= 1
    ids = {item["project_id"] for item in content["data"]}
    assert own_project_id in ids
    assert deleted_project_id not in ids
    assert all(item["name"] != "Other User Project" for item in content["data"])
    current_user = db.exec(select(User).where(User.email == settings.EMAIL_TEST_USER)).first()
    assert current_user is not None
    own_project = next(item for item in content["data"] if item["project_id"] == own_project_id)
    assert own_project["owner"]["id"] == str(current_user.id)
    assert own_project["owner"]["username"] == current_user.username
    assert own_project["owner"]["email"] == current_user.email


def test_get_project_list_for_superuser(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
) -> None:
    normal_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Normal User Visible Project"},
    )
    assert normal_response.status_code == 200
    normal_project_id = normal_response.json()["project_id"]

    super_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
        json={"name": "Super User Visible Project"},
    )
    assert super_response.status_code == 200
    super_project_id = super_response.json()["project_id"]

    list_response = client.get(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
    )
    assert list_response.status_code == 200
    content = list_response.json()
    ids = {item["project_id"] for item in content["data"]}
    assert normal_project_id in ids
    assert super_project_id in ids


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


def test_save_project_elements_batch(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Save Test Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]
    project_uuid = uuid.UUID(project_id)

    save_payload = {
        "preview_image": "data:image/webp;base64,ZmFrZV9wcmV2aWV3",
        "elements": [
            {
                "element_key": "widget-time-1",
                "category": "widget",
                "subtype": "time",
                "x": 120.5,
                "y": 88,
                "visible": True,
                "locked": False,
                "schema_version": 1,
                "config_json": {
                    "ios": {"version": 0},
                    "android": {"version": 0},
                },
            }
        ]
    }
    save_response = client.put(
        f"{settings.API_V1_STR}/project/{project_id}/elements/batch",
        headers=normal_user_token_headers,
        json=save_payload,
    )
    assert save_response.status_code == 200
    save_content = save_response.json()
    assert save_content["project_id"] == project_id
    assert save_content["saved_count"] == 1
    assert "updated_at" in save_content

    saved_element = db.exec(
        select(ProjectElement).where(ProjectElement.project_id == project_uuid)
    ).first()
    assert saved_element is not None
    assert saved_element.element_key == "widget-time-1"
    assert saved_element.category == "widget"
    assert saved_element.subtype == "time"

    saved_config = db.exec(
        select(ElementConfig).where(ElementConfig.element_id == saved_element.id)
    ).first()
    assert saved_config is not None
    assert saved_config.schema_version == 1
    assert saved_config.config_json["ios"]["version"] == 0

    saved_project = db.get(Project, project_uuid)
    assert saved_project is not None
    expected_preview_path = f"data/project/{project_id}/preview.webp"
    assert saved_project.preview_image == f"/{expected_preview_path}"

    backend_root = Path(__file__).resolve().parents[3]
    preview_file = backend_root / expected_preview_path
    assert preview_file.exists()
    preview_response = client.get(saved_project.preview_image)
    assert preview_response.status_code == 200


def test_save_project_preview_only(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Preview Only Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]
    project_uuid = uuid.UUID(project_id)

    save_response = client.put(
        f"{settings.API_V1_STR}/project/{project_id}/elements/batch",
        headers=normal_user_token_headers,
        json={"preview_image": "data:image/webp;base64,ZmFrZV9wcmV2aWV3"},
    )
    assert save_response.status_code == 200
    save_content = save_response.json()
    assert save_content["project_id"] == project_id
    assert save_content["saved_count"] == 0

    saved_project = db.get(Project, project_uuid)
    assert saved_project is not None
    expected_preview_path = f"data/project/{project_id}/preview.webp"
    assert saved_project.preview_image == f"/{expected_preview_path}"

    saved_element = db.exec(
        select(ProjectElement).where(ProjectElement.project_id == project_uuid)
    ).first()
    assert saved_element is None


def test_get_project_detail(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Detail Test Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    save_response = client.put(
        f"{settings.API_V1_STR}/project/{project_id}/elements/batch",
        headers=normal_user_token_headers,
        json={
            "preview_image": "data:image/webp;base64,ZmFrZV9wcmV2aWV3",
            "elements": [
                {
                    "element_key": "widget-time-1",
                    "category": "widget",
                    "subtype": "time",
                    "x": 12,
                    "y": 34,
                    "visible": True,
                    "locked": False,
                    "schema_version": 2,
                    "config_json": {"timezone": "Asia/Shanghai"},
                }
            ],
        },
    )
    assert save_response.status_code == 200

    detail_response = client.get(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["project_id"] == project_id
    assert detail["name"] == "Detail Test Project"
    assert detail["status"] == "draft"
    assert detail["preview_image"] == f"/data/project/{project_id}/preview.webp"
    assert len(detail["elements"]) == 1
    assert detail["elements"][0]["element_key"] == "widget-time-1"
    assert detail["elements"][0]["schema_version"] == 2
    assert detail["elements"][0]["config_json"]["timezone"] == "Asia/Shanghai"


def test_get_project_detail_not_enough_permissions(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
        json={"name": "Owner Only Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    detail_response = client.get(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert detail_response.status_code == 403
    assert detail_response.json()["detail"] == "Not enough permissions"


def test_update_project_name(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Old Project Name"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]
    project_uuid = uuid.UUID(project_id)

    update_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
        json={"name": "New Project Name"},
    )
    assert update_response.status_code == 200
    content = update_response.json()
    assert content["project_id"] == project_id
    assert content["name"] == "New Project Name"
    assert "updated_at" in content

    updated_project = db.get(Project, project_uuid)
    assert updated_project is not None
    assert updated_project.name == "New Project Name"


def test_update_project_name_not_enough_permissions(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
        json={"name": "Super Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    update_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
        json={"name": "Try Change Name"},
    )
    assert update_response.status_code == 403
    assert update_response.json()["detail"] == "Not enough permissions"


def test_delete_project(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Delete Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]
    project_uuid = uuid.UUID(project_id)

    delete_response = client.delete(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert delete_response.status_code == 200
    delete_content = delete_response.json()
    assert delete_content["project_id"] == project_id
    assert delete_content["deleted"] is True
    assert "updated_at" in delete_content

    deleted_project = db.get(Project, project_uuid)
    assert deleted_project is not None
    assert deleted_project.deleted_at is not None

    list_response = client.get(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
    )
    assert list_response.status_code == 200
    ids = {item["project_id"] for item in list_response.json()["data"]}
    assert project_id not in ids


def test_delete_project_not_enough_permissions(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
        json={"name": "Owner Delete Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    delete_response = client.delete(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert delete_response.status_code == 403
    assert delete_response.json()["detail"] == "Not enough permissions"


def test_delete_project_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    non_existing_project_id = uuid.uuid4()
    delete_response = client.delete(
        f"{settings.API_V1_STR}/project/{non_existing_project_id}",
        headers=normal_user_token_headers,
    )
    assert delete_response.status_code == 404
    assert delete_response.json()["detail"] == "Project not found"


def test_upload_project_image(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Upload Image Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    upload_response = client.post(
        f"{settings.API_V1_STR}/project/{project_id}/upload-image",
        headers=normal_user_token_headers,
        files={"file": ("sample.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert upload_response.status_code == 200
    content = upload_response.json()
    assert content["path"].startswith(f"data/project/{project_id}/assets/")
    assert content["url"].startswith("/data/project/")
    assert content["content_type"] == "image/png"
    assert content["size"] > 0

    backend_root = Path(__file__).resolve().parents[3]
    uploaded_file = backend_root / content["path"]
    assert uploaded_file.exists()

    static_response = client.get(content["url"])
    assert static_response.status_code == 200


def test_upload_project_file(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Upload File Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    upload_response = client.post(
        f"{settings.API_V1_STR}/project/{project_id}/upload-file",
        headers=normal_user_token_headers,
        files={"file": ("live.mov", b"fake_mov_binary", "video/quicktime")},
    )
    assert upload_response.status_code == 200
    content = upload_response.json()
    assert content["path"].startswith(f"data/project/{project_id}/assets/")
    assert content["path"].endswith(".mov")
    assert content["content_type"] == "video/quicktime"
    assert content["size"] > 0

    backend_root = Path(__file__).resolve().parents[3]
    uploaded_file = backend_root / content["path"]
    assert uploaded_file.exists()

    static_response = client.get(content["url"])
    assert static_response.status_code == 200


def test_upload_project_file_rejects_non_media(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Upload File Reject Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    upload_response = client.post(
        f"{settings.API_V1_STR}/project/{project_id}/upload-file",
        headers=normal_user_token_headers,
        files={"file": ("sample.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert upload_response.status_code == 400
    assert (
        upload_response.json()["detail"] == "Only video and audio files are supported"
    )


def test_get_project_assets(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "List Assets Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    upload_response = client.post(
        f"{settings.API_V1_STR}/project/{project_id}/upload-image",
        headers=normal_user_token_headers,
        files={"file": ("sample.jpg", b"\xff\xd8\xff\xe0fakejpg", "image/jpeg")},
    )
    assert upload_response.status_code == 200
    uploaded = upload_response.json()

    assets_response = client.get(
        f"{settings.API_V1_STR}/project/{project_id}/assets",
        headers=normal_user_token_headers,
    )
    assert assets_response.status_code == 200
    assets_content = assets_response.json()
    assert assets_content["project_id"] == project_id
    assert len(assets_content["assets"]) >= 1
    assert any(item["path"] == uploaded["path"] for item in assets_content["assets"])


def test_delete_project_asset(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Delete Asset Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    upload_response = client.post(
        f"{settings.API_V1_STR}/project/{project_id}/upload-image",
        headers=normal_user_token_headers,
        files={"file": ("sample.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert upload_response.status_code == 200
    uploaded = upload_response.json()

    delete_response = client.delete(
        f"{settings.API_V1_STR}/project/{project_id}/assets",
        headers=normal_user_token_headers,
        params={"path": uploaded["path"]},
    )
    assert delete_response.status_code == 200
    delete_content = delete_response.json()
    assert delete_content["path"] == uploaded["path"]
    assert delete_content["deleted"] is True

    backend_root = Path(__file__).resolve().parents[3]
    deleted_file = backend_root / uploaded["path"]
    assert not deleted_file.exists()


def _create_public_project(
    client: TestClient, owner_token_headers: dict[str, str], name: str
) -> str:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=owner_token_headers,
        json={"name": name},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    publish_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}/visibility",
        headers=owner_token_headers,
        json={"visibility": "public"},
    )
    assert publish_response.status_code == 200
    return project_id


def test_create_project_defaults_to_private(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Default Visibility Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    created_project = db.get(Project, uuid.UUID(project_id))
    assert created_project is not None
    assert created_project.visibility == "private"


def test_update_project_visibility(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Visibility Switch Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]
    project_uuid = uuid.UUID(project_id)

    publish_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}/visibility",
        headers=normal_user_token_headers,
        json={"visibility": "public"},
    )
    assert publish_response.status_code == 200
    publish_content = publish_response.json()
    assert publish_content["project_id"] == project_id
    assert publish_content["visibility"] == "public"
    assert "updated_at" in publish_content
    db.expire_all()
    assert db.get(Project, project_uuid).visibility == "public"

    revert_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}/visibility",
        headers=normal_user_token_headers,
        json={"visibility": "private"},
    )
    assert revert_response.status_code == 200
    assert revert_response.json()["visibility"] == "private"
    db.expire_all()
    assert db.get(Project, project_uuid).visibility == "private"


def test_update_project_visibility_rejects_invalid_value(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create_response = client.post(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
        json={"name": "Invalid Visibility Project"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["project_id"]

    response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}/visibility",
        headers=normal_user_token_headers,
        json={"visibility": "everyone"},
    )
    assert response.status_code == 422


def test_update_project_visibility_not_enough_permissions(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    project_id = _create_public_project(
        client, superuser_token_headers, "Public Visibility Guard Project"
    )

    response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}/visibility",
        headers=normal_user_token_headers,
        json={"visibility": "private"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_public_project_listed_for_other_users(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    project_id = _create_public_project(
        client, superuser_token_headers, "Public Listed Project"
    )

    list_response = client.get(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
    )
    assert list_response.status_code == 200
    items = list_response.json()["data"]
    listed = next(item for item in items if item["project_id"] == project_id)
    assert listed["visibility"] == "public"
    # 别人的公开项目只能看，前端据此隐藏删除/改可见性入口
    assert listed["can_edit"] is False

    owner_list_response = client.get(
        f"{settings.API_V1_STR}/project/",
        headers=superuser_token_headers,
    )
    assert owner_list_response.status_code == 200
    owner_items = owner_list_response.json()["data"]
    owner_listed = next(
        item for item in owner_items if item["project_id"] == project_id
    )
    assert owner_listed["can_edit"] is True


def test_private_project_hidden_after_revert(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    project_id = _create_public_project(
        client, superuser_token_headers, "Revert To Private Project"
    )

    revert_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}/visibility",
        headers=superuser_token_headers,
        json={"visibility": "private"},
    )
    assert revert_response.status_code == 200

    list_response = client.get(
        f"{settings.API_V1_STR}/project/",
        headers=normal_user_token_headers,
    )
    assert list_response.status_code == 200
    ids = {item["project_id"] for item in list_response.json()["data"]}
    assert project_id not in ids

    detail_response = client.get(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert detail_response.status_code == 403


def test_get_public_project_detail_is_readonly(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    project_id = _create_public_project(
        client, superuser_token_headers, "Public Detail Project"
    )

    detail_response = client.get(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["visibility"] == "public"
    assert detail["can_edit"] is False


def test_public_project_rejects_writes_from_other_users(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    normal_user_token_headers: dict[str, str],
) -> None:
    project_id = _create_public_project(
        client, superuser_token_headers, "Public Write Guard Project"
    )

    save_response = client.put(
        f"{settings.API_V1_STR}/project/{project_id}/elements/batch",
        headers=normal_user_token_headers,
        json={"elements": []},
    )
    assert save_response.status_code == 403

    rename_response = client.patch(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
        json={"name": "Hijacked Name"},
    )
    assert rename_response.status_code == 403

    delete_response = client.delete(
        f"{settings.API_V1_STR}/project/{project_id}",
        headers=normal_user_token_headers,
    )
    assert delete_response.status_code == 403

    upload_response = client.post(
        f"{settings.API_V1_STR}/project/{project_id}/upload-image",
        headers=normal_user_token_headers,
        files={"file": ("sample.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert upload_response.status_code == 403
