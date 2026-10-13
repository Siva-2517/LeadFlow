import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class DiscussionBase(BaseModel):
    note: str = Field(..., min_length=1, description="Discussion note text")
    follow_up_at: Optional[datetime] = Field(None, description="Scheduled follow-up date and time")

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Discussion note cannot be empty or blank")
        return trimmed


class DiscussionCreate(DiscussionBase):
    clear_follow_up: Optional[bool] = Field(
        False, description="Set to true to explicitly clear the existing scheduled follow-up"
    )


class DiscussionResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    note: str
    follow_up_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
