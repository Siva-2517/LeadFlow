import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadDetailResponse,
)
from app.schemas.discussion import DiscussionCreate, DiscussionResponse
from app.schemas.stats import StatsSummary
from app.services import lead_service

router = APIRouter()


@router.get(
    "/leads/stats/summary",
    response_model=StatsSummary,
    summary="Get leads summary metrics",
)
def get_leads_summary(db: Session = Depends(get_db)):
    return lead_service.get_stats_summary(db)


@router.get(
    "/leads",
    response_model=List[LeadResponse],
    summary="List leads with search and filtering",
)
def list_leads(
    query: Optional[str] = Query(None, description="Search leads by name"),
    status: Optional[str] = Query(None, description="Filter by status (or All)"),
    db: Session = Depends(get_db),
):
    return lead_service.list_leads(db=db, query_str=query, status=status)


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lead",
)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    lead = lead_service.create_lead(db=db, lead_in=lead_in)
    return lead_service._build_lead_response(lead)


@router.get(
    "/leads/{lead_id}",
    response_model=LeadDetailResponse,
    summary="Get lead details with timeline",
)
def get_lead(lead_id: uuid.UUID, db: Session = Depends(get_db)):
    lead_detail = lead_service.get_lead_detail(db=db, lead_id=lead_id)
    if not lead_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id '{lead_id}' not found",
        )
    return lead_detail


@router.patch(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    summary="Update lead status or details",
)
def update_lead(
    lead_id: uuid.UUID,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
):
    lead = lead_service.get_lead(db=db, lead_id=lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id '{lead_id}' not found",
        )
    updated = lead_service.update_lead(db=db, lead=lead, lead_in=lead_in)
    return lead_service._build_lead_response(updated)


@router.get(
    "/leads/{lead_id}/discussions",
    response_model=List[DiscussionResponse],
    summary="Get all discussions for a lead",
)
def list_discussions(lead_id: uuid.UUID, db: Session = Depends(get_db)):
    lead = lead_service.get_lead(db=db, lead_id=lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id '{lead_id}' not found",
        )
    discussions = lead_service.list_discussions(db=db, lead_id=lead_id)
    return [DiscussionResponse.model_validate(d) for d in discussions]


@router.post(
    "/leads/{lead_id}/discussions",
    response_model=DiscussionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a discussion note and optional follow-up",
)
def create_discussion(
    lead_id: uuid.UUID,
    discussion_in: DiscussionCreate,
    db: Session = Depends(get_db),
):
    lead = lead_service.get_lead(db=db, lead_id=lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id '{lead_id}' not found",
        )
    discussion = lead_service.create_discussion(
        db=db, lead=lead, discussion_in=discussion_in
    )
    return DiscussionResponse.model_validate(discussion)
