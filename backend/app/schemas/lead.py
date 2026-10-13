import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.lead import LeadStatus
from app.schemas.discussion import DiscussionResponse


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of lead")
    company: Optional[str] = Field(None, max_length=255, description="Company name")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    status: Optional[LeadStatus] = Field(LeadStatus.NEW, description="Lead status")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Name cannot be empty or only whitespace")
        return trimmed

    @field_validator("company", "phone")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    status: Optional[LeadStatus] = None
    next_follow_up_at: Optional[datetime] = None
    clear_follow_up: Optional[bool] = False

    @field_validator("name")
    @classmethod
    def validate_name_if_present(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Name cannot be empty or only whitespace")
        return trimmed

    @field_validator("company", "phone")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        return trimmed if trimmed else None


class LeadResponse(BaseModel):
    id: uuid.UUID
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    status: str
    next_follow_up_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Preview and computed fields for UI ease & responsiveness
    latest_discussion_note: Optional[str] = None
    latest_discussion_at: Optional[datetime] = None
    is_today_follow_up: bool = False
    is_overdue: bool = False

    model_config = {"from_attributes": True}


class LeadDetailResponse(LeadResponse):
    discussions: List[DiscussionResponse] = []
