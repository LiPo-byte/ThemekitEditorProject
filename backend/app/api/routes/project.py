import base64
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from sqlmodel import col, func, or_, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ElementConfig,
    Project,
    ProjectAssetItem,
    ProjectAssetsResponse,
    ProjectCreate,
    ProjectCreateResponse,
    ProjectDeleteImageResponse,
    ProjectDeleteResponse,
    ProjectDetailElement,
    ProjectDetailResponse,
    ProjectElement,
    ProjectListItem,
    ProjectListResponse,
    ProjectOwnerInfo,
    ProjectSaveRequest,
    ProjectSaveResponse,
    ProjectUpdateNameRequest,
    ProjectUpdateNameResponse,
    ProjectUpdateVisibilityRequest,
    ProjectUpdateVisibilityResponse,
    ProjectUploadFileResponse,
    ProjectUploadImageResponse,
    User,
)

router = APIRouter(prefix="/project", tags=["project"])
_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_PREVIEW_DIR = _BACKEND_ROOT / "data" / "project"
_MIME_TO_EXT = {
    "image/webp": "webp",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
}
_ASSET_DIR = _PREVIEW_DIR
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
# 动态壁纸的 mov/mp4 远超图片体积，单独给上限，不影响图片上传
_MEDIA_MIME_TO_EXT = {
    "video/quicktime": "mov",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
}
_MAX_MEDIA_UPLOAD_BYTES = 100 * 1024 * 1024
_MEDIA_CHUNK_BYTES = 1024 * 1024


def _save_preview_image(project_id: uuid.UUID, preview_data_url: str) -> str:
    if ";base64," not in preview_data_url or not preview_data_url.startswith("data:"):
        raise HTTPException(status_code=400, detail="Invalid preview image format")

    header, encoded = preview_data_url.split(";base64,", maxsplit=1)
    mime_type = header.replace("data:", "", 1).strip().lower()
    extension = _MIME_TO_EXT.get(mime_type, "webp")

    try:
        binary = base64.b64decode(encoded, validate=True)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid preview image content") from error

    target_dir = _PREVIEW_DIR / str(project_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_file = target_dir / f"preview.{extension}"
    target_file.write_bytes(binary)
    return f"data/project/{project_id}/preview.{extension}"


def _guess_extension(content_type: str | None, filename: str | None) -> str:
    if content_type:
        ext_from_mime = _MIME_TO_EXT.get(content_type.lower())
        if ext_from_mime:
            return ext_from_mime
    if filename and "." in filename:
        return filename.rsplit(".", maxsplit=1)[-1].lower()
    return "bin"


def _guess_media_extension(content_type: str, filename: str | None) -> str:
    ext_from_mime = _MEDIA_MIME_TO_EXT.get(content_type.lower())
    if ext_from_mime:
        return ext_from_mime
    if filename and "." in filename:
        return filename.rsplit(".", maxsplit=1)[-1].lower()
    return "bin"


def _can_edit_project(project: Project, current_user: User) -> bool:
    """公开项目对他人只读，写操作始终只放给 owner 和超管。"""
    return current_user.is_superuser or project.owner_id == current_user.id


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
        visibility="private",
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectCreateResponse(project_id=project.id)


@router.get("/", response_model=ProjectListResponse)
def get_project_list(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    base_condition = Project.deleted_at.is_(None)
    if current_user.is_superuser:
        count_statement = (
            select(func.count()).select_from(Project).where(base_condition)
        )
        statement = (
            select(Project, User)
            .join(User, User.id == Project.owner_id)
            .where(base_condition)
            .order_by(col(Project.updated_at).desc())
            .offset(skip)
            .limit(limit)
        )
    else:
        # 自己的项目全都能看到，别人的只看得到公开的
        visible_condition = or_(
            Project.owner_id == current_user.id,
            Project.visibility == "public",
        )
        count_statement = (
            select(func.count())
            .select_from(Project)
            .where(base_condition, visible_condition)
        )
        statement = (
            select(Project, User)
            .join(User, User.id == Project.owner_id)
            .where(base_condition, visible_condition)
            .order_by(col(Project.updated_at).desc())
            .offset(skip)
            .limit(limit)
        )

    count = session.exec(count_statement).one()
    projects = session.exec(statement).all()
    data = [
        ProjectListItem(
            project_id=project.id,
            name=project.name,
            status=project.status,
            current_version=project.current_version,
            visibility=project.visibility,
            can_edit=_can_edit_project(project, current_user),
            preview_image=project.preview_image,
            created_at=project.created_at,
            updated_at=project.updated_at,
            owner=ProjectOwnerInfo(
                id=owner.id,
                username=owner.username,
                email=owner.email,
                full_name=owner.full_name,
            ),
        )
        for project, owner in projects
    ]
    return ProjectListResponse(data=data, count=count)


@router.put("/{project_id}/elements/batch", response_model=ProjectSaveResponse)
def save_project_elements(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    save_in: ProjectSaveRequest,
) -> Any:
    """
    Save all project elements/configs in one request.
    """
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    now_utc = datetime.now(timezone.utc)
    saved_count = 0
    if save_in.elements is not None:
        existing_elements = session.exec(
            select(ProjectElement).where(ProjectElement.project_id == project.id)
        ).all()
        existing_by_key = {item.element_key: item for item in existing_elements}
        incoming_keys = {item.element_key for item in save_in.elements}

        for existing in existing_elements:
            if existing.element_key not in incoming_keys:
                existing.deleted_at = now_utc
                existing.updated_at = now_utc
                session.add(existing)

        for item in save_in.elements:
            element = existing_by_key.get(item.element_key)
            if element:
                element.category = item.category
                element.subtype = item.subtype
                element.x = item.x
                element.y = item.y
                element.visible = item.visible
                element.locked = item.locked
                element.deleted_at = None
                element.updated_at = now_utc
                session.add(element)
            else:
                element = ProjectElement(
                    project_id=project.id,
                    element_key=item.element_key,
                    category=item.category,
                    subtype=item.subtype,
                    x=item.x,
                    y=item.y,
                    visible=item.visible,
                    locked=item.locked,
                )
                session.add(element)
                session.flush()

            config = session.exec(
                select(ElementConfig).where(ElementConfig.element_id == element.id)
            ).first()
            if config:
                config.schema_version = item.schema_version
                config.config_json = item.config_json
                config.updated_at = now_utc
                session.add(config)
            else:
                config = ElementConfig(
                    element_id=element.id,
                    schema_version=item.schema_version,
                    config_json=item.config_json,
                )
                session.add(config)
            saved_count += 1

    if save_in.preview_image is not None:
        if save_in.preview_image.strip():
            preview_path = _save_preview_image(project.id, save_in.preview_image)
            project.preview_image = f"/{preview_path}"
        else:
            project.preview_image = None
    project.updated_at = now_utc
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectSaveResponse(
        project_id=project.id,
        saved_count=saved_count,
        updated_at=project.updated_at or now_utc,
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_detail(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
) -> Any:
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    can_edit = _can_edit_project(project, current_user)
    if not can_edit and project.visibility != "public":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    element_rows = session.exec(
        select(ProjectElement, ElementConfig)
        .where(
            ProjectElement.project_id == project.id,
            ProjectElement.deleted_at.is_(None),
        )
        .join(ElementConfig, ElementConfig.element_id == ProjectElement.id, isouter=True)
        .order_by(ProjectElement.created_at)
    ).all()

    elements: list[ProjectDetailElement] = []
    for element, config in element_rows:
        elements.append(
            ProjectDetailElement(
                element_key=element.element_key,
                category=element.category,
                subtype=element.subtype,
                x=element.x,
                y=element.y,
                visible=element.visible,
                locked=element.locked,
                schema_version=config.schema_version if config else 1,
                config_json=config.config_json if config else {},
            )
        )

    return ProjectDetailResponse(
        project_id=project.id,
        name=project.name,
        status=project.status,
        current_version=project.current_version,
        visibility=project.visibility,
        can_edit=can_edit,
        preview_image=project.preview_image,
        created_at=project.created_at,
        updated_at=project.updated_at,
        elements=elements,
    )


@router.patch("/{project_id}", response_model=ProjectUpdateNameResponse)
def update_project_name(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    project_in: ProjectUpdateNameRequest,
) -> Any:
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    project.name = project_in.name
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectUpdateNameResponse(
        project_id=project.id,
        name=project.name,
        updated_at=project.updated_at or datetime.now(timezone.utc),
    )


@router.patch("/{project_id}/visibility", response_model=ProjectUpdateVisibilityResponse)
def update_project_visibility(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    visibility_in: ProjectUpdateVisibilityRequest,
) -> Any:
    """
    Switch a project between private and public.
    """
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can_edit_project(project, current_user):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    now_utc = datetime.now(timezone.utc)
    project.visibility = visibility_in.visibility
    project.updated_at = now_utc
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectUpdateVisibilityResponse(
        project_id=project.id,
        visibility=project.visibility,
        updated_at=project.updated_at or now_utc,
    )


@router.delete("/{project_id}", response_model=ProjectDeleteResponse)
def delete_project(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
) -> Any:
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    now_utc = datetime.now(timezone.utc)
    project.deleted_at = now_utc
    project.updated_at = now_utc
    session.add(project)
    session.commit()

    return ProjectDeleteResponse(
        project_id=project.id,
        deleted=True,
        updated_at=now_utc,
    )


@router.post("/{project_id}/upload-image", response_model=ProjectUploadImageResponse)
async def upload_project_image(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    file: UploadFile = File(...),
) -> Any:
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not file.content_type or not file.content_type.lower().startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty upload file")
    if len(content) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    ext = _guess_extension(file.content_type, file.filename)
    target_dir = _ASSET_DIR / str(project_id) / "assets"
    target_dir.mkdir(parents=True, exist_ok=True)
    file_id = uuid.uuid4()
    relative_path = f"data/project/{project_id}/assets/{file_id}.{ext}"
    target_file = _BACKEND_ROOT / relative_path
    target_file.write_bytes(content)

    return ProjectUploadImageResponse(
        url=f"/{relative_path}",
        path=relative_path,
        content_type=file.content_type,
        size=len(content),
    )


@router.post("/{project_id}/upload-file", response_model=ProjectUploadFileResponse)
async def upload_project_file(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    file: UploadFile = File(...),
) -> Any:
    """
    Upload a video/audio asset (live wallpaper mov/mp4 etc).
    """
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    content_type = (file.content_type or "").lower()
    if content_type not in _MEDIA_MIME_TO_EXT:
        raise HTTPException(
            status_code=400, detail="Only video and audio files are supported"
        )

    ext = _guess_media_extension(content_type, file.filename)
    target_dir = _ASSET_DIR / str(project_id) / "assets"
    target_dir.mkdir(parents=True, exist_ok=True)
    file_id = uuid.uuid4()
    relative_path = f"data/project/{project_id}/assets/{file_id}.{ext}"
    target_file = _BACKEND_ROOT / relative_path

    # 视频体积大，边读边写避免整体进内存；中途失败要清掉写了一半的文件
    size = 0
    try:
        with target_file.open("wb") as buffer:
            while chunk := await file.read(_MEDIA_CHUNK_BYTES):
                size += len(chunk)
                if size > _MAX_MEDIA_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File too large")
                buffer.write(chunk)
        if not size:
            raise HTTPException(status_code=400, detail="Empty upload file")
    except HTTPException:
        target_file.unlink(missing_ok=True)
        raise
    except OSError as error:
        target_file.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500, detail="Failed to save upload file"
        ) from error

    return ProjectUploadFileResponse(
        url=f"/{relative_path}",
        path=relative_path,
        content_type=content_type,
        size=size,
    )


@router.get("/{project_id}/assets", response_model=ProjectAssetsResponse)
def get_project_assets(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
) -> Any:
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    assets_dir = _ASSET_DIR / str(project_id) / "assets"
    if not assets_dir.exists():
        return ProjectAssetsResponse(project_id=project_id, assets=[])

    assets: list[ProjectAssetItem] = []
    for file_path in sorted(assets_dir.glob("*")):
        if not file_path.is_file():
            continue
        relative_path = f"data/project/{project_id}/assets/{file_path.name}"
        content_type, _ = mimetypes.guess_type(str(file_path))
        assets.append(
            ProjectAssetItem(
                url=f"/{relative_path}",
                path=relative_path,
                content_type=content_type,
                size=file_path.stat().st_size,
            )
        )

    return ProjectAssetsResponse(project_id=project_id, assets=assets)


@router.delete("/{project_id}/assets", response_model=ProjectDeleteImageResponse)
def delete_project_asset(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    project_id: uuid.UUID,
    path: str,
) -> Any:
    project = session.get(Project, project_id)
    if not project or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not current_user.is_superuser and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    expected_prefix = f"data/project/{project_id}/assets/"
    if not path.startswith(expected_prefix):
        raise HTTPException(status_code=400, detail="Invalid asset path")

    assets_dir = (_ASSET_DIR / str(project_id) / "assets").resolve()
    target_file = (_BACKEND_ROOT / path).resolve()
    try:
        target_file.relative_to(assets_dir)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid asset path") from error

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail="Asset not found")

    target_file.unlink()
    return ProjectDeleteImageResponse(path=path, deleted=True)
