import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from app.models.lead import Lead, LeadStatus
from app.models.discussion import Discussion
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadDetailResponse,
)
from app.schemas.discussion import DiscussionCreate, DiscussionResponse
from app.schemas.stats import StatsSummary
from app.core.timezone import (
    now_utc,
    to_utc,
    is_follow_up_today,
    is_follow_up_overdue,
)


def _build_lead_response(lead: Lead) -> LeadResponse:
    latest_note = None
    latest_note_at = None
    if lead.discussions:
        latest = lead.discussions[0]
        latest_note = latest.note
        latest_note_at = to_utc(latest.created_at)

    is_today = is_follow_up_today(lead.next_follow_up_at)
    is_overdue = is_follow_up_overdue(lead.next_follow_up_at) and (
        lead.status not in [LeadStatus.WON.value, LeadStatus.LOST.value]
    )

    return LeadResponse(
        id=lead.id,
        name=lead.name,
        company=lead.company,
        phone=lead.phone,
        status=lead.status,
        next_follow_up_at=to_utc(lead.next_follow_up_at),
        created_at=to_utc(lead.created_at) or now_utc(),
        updated_at=to_utc(lead.updated_at) or now_utc(),
        latest_discussion_note=latest_note,
        latest_discussion_at=latest_note_at,
        is_today_follow_up=is_today,
        is_overdue=is_overdue,
    )


def list_leads(
    db: Session,
    query_str: Optional[str] = None,
    status: Optional[str] = None,
) -> List[LeadResponse]:
    q = db.query(Lead).options(selectinload(Lead.discussions))

    if query_str and query_str.strip():
        search = f"%{query_str.strip()}%"
        q = q.filter(Lead.name.ilike(search))

    if status and status.strip() and status.strip() != "All":
        q = q.filter(Lead.status == status.strip())

    all_matching_leads = q.all()

    today_leads: List[Lead] = []
    other_leads: List[Lead] = []

    for lead in all_matching_leads:
        if is_follow_up_today(lead.next_follow_up_at):
            today_leads.append(lead)
        else:
            other_leads.append(lead)

    # Sort today's follow-ups by scheduled time ascending
    today_leads.sort(
        key=lambda l: to_utc(l.next_follow_up_at) or now_utc()
    )

    # Sort other leads by most recently updated first
    other_leads.sort(
        key=lambda l: to_utc(l.updated_at) or now_utc(),
        reverse=True,
    )

    sorted_leads = today_leads + other_leads
    return [_build_lead_response(l) for l in sorted_leads]


def get_lead(db: Session, lead_id: uuid.UUID) -> Optional[Lead]:
    return (
        db.query(Lead)
        .options(selectinload(Lead.discussions))
        .filter(Lead.id == lead_id)
        .first()
    )


def get_lead_detail(db: Session, lead_id: uuid.UUID) -> Optional[LeadDetailResponse]:
    lead = get_lead(db, lead_id)
    if not lead:
        return None

    base_resp = _build_lead_response(lead)
    discussions_resp = [
        DiscussionResponse(
            id=d.id,
            lead_id=d.lead_id,
            note=d.note,
            follow_up_at=to_utc(d.follow_up_at),
            created_at=to_utc(d.created_at) or now_utc(),
        )
        for d in lead.discussions
    ]

    return LeadDetailResponse(
        **base_resp.model_dump(),
        discussions=discussions_resp,
    )


def create_lead(db: Session, lead_in: LeadCreate) -> Lead:
    status_val = lead_in.status.value if lead_in.status else LeadStatus.NEW.value
    lead = Lead(
        name=lead_in.name,
        company=lead_in.company,
        phone=lead_in.phone,
        status=status_val,
        created_at=now_utc(),
        updated_at=now_utc(),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def update_lead(db: Session, lead: Lead, lead_in: LeadUpdate) -> Lead:
    if lead_in.name is not None:
        lead.name = lead_in.name
    if lead_in.company is not None:
        lead.company = lead_in.company
    if lead_in.phone is not None:
        lead.phone = lead_in.phone
    if lead_in.status is not None:
        lead.status = lead_in.status.value

    if lead_in.clear_follow_up:
        lead.next_follow_up_at = None
    elif lead_in.next_follow_up_at is not None:
        lead.next_follow_up_at = to_utc(lead_in.next_follow_up_at)

    lead.updated_at = now_utc()
    db.commit()
    db.refresh(lead)
    return lead


def create_discussion(
    db: Session,
    lead: Lead,
    discussion_in: DiscussionCreate,
) -> Discussion:
    follow_up_utc = to_utc(discussion_in.follow_up_at) if discussion_in.follow_up_at else None

    discussion = Discussion(
        lead_id=lead.id,
        note=discussion_in.note,
        follow_up_at=follow_up_utc,
        created_at=now_utc(),
    )

    db.add(discussion)

    # Atomic follow-up update
    if follow_up_utc is not None:
        lead.next_follow_up_at = follow_up_utc
    elif discussion_in.clear_follow_up:
        lead.next_follow_up_at = None

    lead.updated_at = now_utc()
    db.add(lead)

    db.commit()
    db.refresh(discussion)
    db.refresh(lead)
    return discussion


def list_discussions(db: Session, lead_id: uuid.UUID) -> List[Discussion]:
    return (
        db.query(Discussion)
        .filter(Discussion.lead_id == lead_id)
        .order_by(Discussion.created_at.desc())
        .all()
    )


def get_stats_summary(db: Session) -> StatsSummary:
    all_leads = db.query(Lead).all()
    total_leads = len(all_leads)
    follow_ups_today = 0
    overdue_follow_ups = 0
    won_leads = 0

    for l in all_leads:
        if l.status == LeadStatus.WON.value:
            won_leads += 1
        if is_follow_up_today(l.next_follow_up_at):
            follow_ups_today += 1
        if is_follow_up_overdue(l.next_follow_up_at) and (
            l.status not in [LeadStatus.WON.value, LeadStatus.LOST.value]
        ):
            overdue_follow_ups += 1

    return StatsSummary(
        total_leads=total_leads,
        follow_ups_today=follow_ups_today,
        overdue_follow_ups=overdue_follow_ups,
        won_leads=won_leads,
    )
