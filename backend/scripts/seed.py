import os
import sys
from datetime import datetime, timedelta, timezone, time

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, Base, engine
from app.models.lead import Lead, LeadStatus
from app.models.discussion import Discussion
from app.core.timezone import get_app_timezone, now_utc, to_utc


def seed():
    print("Connecting to database and verifying schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    tz = get_app_timezone()
    now_local = datetime.now(tz)
    current_utc = now_utc()

    # Calculate today at 2:00 PM local time in Asia/Kolkata
    today_2pm_local = datetime.combine(now_local.date(), time(14, 0), tzinfo=tz)
    today_2pm_utc = today_2pm_local.astimezone(timezone.utc)

    # Calculate an overdue follow-up (yesterday at 3:00 PM local time)
    yesterday_local = now_local - timedelta(days=1)
    yesterday_3pm_local = datetime.combine(yesterday_local.date(), time(15, 0), tzinfo=tz)
    yesterday_3pm_utc = yesterday_3pm_local.astimezone(timezone.utc)

    # Lead definitions matching requirements and design references
    leads_data = [
        {
            "name": "Sarah Connor",
            "company": "Acme Corp",
            "phone": "555-0199",
            "status": LeadStatus.PROPOSAL_SENT.value,
            "next_follow_up_at": today_2pm_utc,  # Follow-up TODAY
            "discussions": [
                {
                    "note": "Lead created via web form.",
                    "created_at": current_utc - timedelta(days=6),
                    "follow_up_at": None,
                },
                {
                    "note": "Initial discovery call. They need a CRM for 50 reps. Pain points include dropping leads and no follow-up tracking.",
                    "created_at": current_utc - timedelta(days=5),
                    "follow_up_at": current_utc - timedelta(days=2),
                },
                {
                    "note": "Sent pricing tier PDF. Said she would review with her boss.",
                    "created_at": current_utc - timedelta(days=2),
                    "follow_up_at": today_2pm_utc,
                },
            ],
        },
        {
            "name": "Hank Scorpio",
            "company": "Globex",
            "phone": "555-0144",
            "status": LeadStatus.NEW.value,
            "next_follow_up_at": yesterday_3pm_utc,  # OVERDUE follow-up!
            "discussions": [
                {
                    "note": "Inbound lead from website contact form. Inquiring about enterprise license options.",
                    "created_at": current_utc - timedelta(hours=2),
                    "follow_up_at": yesterday_3pm_utc,
                }
            ],
        },
        {
            "name": "Bill Lumbergh",
            "company": "Initech",
            "phone": "555-0182",
            "status": LeadStatus.CONTACTED.value,
            "next_follow_up_at": None,  # No follow-up
            "discussions": [
                {
                    "note": "Left a voicemail with his assistant regarding Q3 migration plans.",
                    "created_at": current_utc - timedelta(days=7),
                    "follow_up_at": None,
                }
            ],
        },
        {
            "name": "Bruce Wayne",
            "company": "Wayne Ent",
            "phone": "555-0190",
            "status": LeadStatus.WON.value,
            "next_follow_up_at": None,
            "discussions": [
                {
                    "note": "Contract signed! Sending welcome package and scheduling onboarding session.",
                    "created_at": current_utc - timedelta(days=21),
                    "follow_up_at": None,
                }
            ],
        },
        {
            "name": "Diana Prince",
            "company": "Themyscira Global",
            "phone": "555-0128",
            "status": LeadStatus.QUALIFIED.value,
            "next_follow_up_at": None,
            "discussions": [],  # Lead without discussion history
        },
        {
            "name": "Arthur Dent",
            "company": "Megadodo Pub",
            "phone": "555-0177",
            "status": LeadStatus.LOST.value,
            "next_follow_up_at": None,
            "discussions": [
                {
                    "note": "Budget frozen for this fiscal quarter. Re-evaluate in Q1 next year.",
                    "created_at": current_utc - timedelta(days=14),
                    "follow_up_at": None,
                }
            ],
        },
    ]

    try:
        for item in leads_data:
            # Idempotency check: see if lead already exists by name
            existing_lead = db.query(Lead).filter(Lead.name == item["name"]).first()
            if existing_lead:
                print(f"Updating existing lead: {item['name']}")
                existing_lead.company = item["company"]
                existing_lead.phone = item["phone"]
                existing_lead.status = item["status"]
                existing_lead.next_follow_up_at = item["next_follow_up_at"]
                existing_lead.updated_at = current_utc
                lead_obj = existing_lead
            else:
                print(f"Creating lead: {item['name']}")
                lead_obj = Lead(
                    name=item["name"],
                    company=item["company"],
                    phone=item["phone"],
                    status=item["status"],
                    next_follow_up_at=item["next_follow_up_at"],
                    created_at=current_utc - timedelta(days=10),
                    updated_at=current_utc,
                )
                db.add(lead_obj)
                db.flush()

            # Ensure discussions
            if item["discussions"]:
                for d in item["discussions"]:
                    # Check if discussion already exists for this lead
                    exists = (
                        db.query(Discussion)
                        .filter(
                            Discussion.lead_id == lead_obj.id,
                            Discussion.note == d["note"],
                        )
                        .first()
                    )
                    if not exists:
                        disc = Discussion(
                            lead_id=lead_obj.id,
                            note=d["note"],
                            follow_up_at=d["follow_up_at"],
                            created_at=d["created_at"],
                        )
                        db.add(disc)

        db.commit()
        print("Database successfully seeded with realistic sample data!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
