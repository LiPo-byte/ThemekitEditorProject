import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import EmailStr
from sqlalchemy import JSON, DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    username: str = Field(
        unique=True,
        index=True,
        min_length=3,
        max_length=32,
        regex=r"^[A-Za-z0-9_]+$",
    )
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    username: str = Field(
        min_length=3,
        max_length=32,
        regex=r"^[A-Za-z0-9_]+$",
    )
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    username: str | None = Field(  # type: ignore[assignment]
        default=None,
        min_length=3,
        max_length=32,
        regex=r"^[A-Za-z0-9_]+$",
    )
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=32,
        regex=r"^[A-Za-z0-9_]+$",
    )


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    projects: list["Project"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


class ProjectBase(SQLModel):
    name: str = Field(min_length=1, max_length=128)
    status: str = Field(default="draft", max_length=20)
    current_version: int = Field(default=0, ge=0)


class ProjectCreate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)


class ProjectCreateResponse(SQLModel):
    project_id: uuid.UUID


class ProjectElementSave(SQLModel):
    element_key: str = Field(min_length=1, max_length=128)
    category: str = Field(min_length=1, max_length=32)
    subtype: str = Field(min_length=1, max_length=32)
    x: float = 0
    y: float = 0
    visible: bool = True
    locked: bool = False
    schema_version: int = Field(default=1, ge=1)
    config_json: dict[str, Any] = Field(default_factory=dict)


class ProjectSaveRequest(SQLModel):
    elements: list[ProjectElementSave] | None = None
    preview_image: str | None = None


class ProjectSaveResponse(SQLModel):
    project_id: uuid.UUID
    saved_count: int
    updated_at: datetime


class ProjectDetailElement(SQLModel):
    element_key: str
    category: str
    subtype: str
    x: float
    y: float
    visible: bool
    locked: bool
    schema_version: int
    config_json: dict[str, Any]


class ProjectDetailResponse(SQLModel):
    project_id: uuid.UUID
    name: str
    status: str
    current_version: int
    preview_image: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    elements: list[ProjectDetailElement]


class ProjectUploadImageResponse(SQLModel):
    url: str
    path: str
    content_type: str
    size: int


class ProjectAssetItem(SQLModel):
    url: str
    path: str
    content_type: str | None = None
    size: int


class ProjectAssetsResponse(SQLModel):
    project_id: uuid.UUID
    assets: list[ProjectAssetItem]


class Project(ProjectBase, table=True):
    __tablename__ = "project"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    preview_image: str | None = None
    deleted_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore
    owner: User | None = Relationship(back_populates="projects")
    elements: list["ProjectElement"] = Relationship(
        back_populates="project", cascade_delete=True
    )


class ProjectElementBase(SQLModel):
    element_key: str = Field(min_length=1, max_length=128)
    category: str = Field(min_length=1, max_length=32)
    subtype: str = Field(min_length=1, max_length=32)
    x: float = 0
    y: float = 0
    visible: bool = True
    locked: bool = False


class ProjectElement(ProjectElementBase, table=True):
    __tablename__ = "project_element"
    __table_args__ = (UniqueConstraint("project_id", "element_key"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    deleted_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore
    project: Project | None = Relationship(back_populates="elements")
    config: "ElementConfig" = Relationship(back_populates="element")


class ElementConfigBase(SQLModel):
    schema_version: int = Field(default=1, ge=1)
    config_json: dict[str, Any] = Field(default_factory=dict, sa_type=JSON)


class ElementConfig(ElementConfigBase, table=True):
    __tablename__ = "element_config"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    element_id: uuid.UUID = Field(
        foreign_key="project_element.id", nullable=False, unique=True, ondelete="CASCADE"
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    element: ProjectElement | None = Relationship(back_populates="config")


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
