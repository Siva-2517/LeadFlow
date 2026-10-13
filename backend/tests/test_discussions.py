from datetime import datetime, timezone, timedelta
from fastapi import status


def test_create_discussion_and_preserve_follow_up(client):
    # 1. Create a lead
    create_res = client.post("/api/v1/leads", json={"name": "Sarah Connor"})
    lead_id = create_res.json()["id"]

    # 2. Add discussion with a follow-up date
    future_follow_up = (
        datetime.now(timezone.utc) + timedelta(days=2)
    ).isoformat()
    disc_res1 = client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={
            "note": "First call. Scheduled demo.",
            "follow_up_at": future_follow_up,
        },
    )
    assert disc_res1.status_code == status.HTTP_201_CREATED

    # Verify lead has next_follow_up_at set
    lead_res1 = client.get(f"/api/v1/leads/{lead_id}")
    assert lead_res1.json()["next_follow_up_at"] is not None

    # 3. Add second discussion WITHOUT follow-up -> Must PRESERVE existing follow-up!
    disc_res2 = client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={"note": "Quick email note without changing follow-up"},
    )
    assert disc_res2.status_code == status.HTTP_201_CREATED

    lead_res2 = client.get(f"/api/v1/leads/{lead_id}")
    assert lead_res2.json()["next_follow_up_at"] is not None
    assert (
        lead_res2.json()["latest_discussion_note"]
        == "Quick email note without changing follow-up"
    )

    # 4. Add third discussion with clear_follow_up=True -> Must clear follow-up!
    disc_res3 = client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={
            "note": "Meeting concluded, no further follow-up required.",
            "clear_follow_up": True,
        },
    )
    assert disc_res3.status_code == status.HTTP_201_CREATED

    lead_res3 = client.get(f"/api/v1/leads/{lead_id}")
    assert lead_res3.json()["next_follow_up_at"] is None


def test_discussion_ordering_newest_first(client):
    create_res = client.post("/api/v1/leads", json={"name": "Barry Allen"})
    lead_id = create_res.json()["id"]

    client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={"note": "Discussion 1: Initial call"},
    )
    client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={"note": "Discussion 2: Follow-up check"},
    )
    client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={"note": "Discussion 3: Contract review"},
    )

    disc_list_res = client.get(f"/api/v1/leads/{lead_id}/discussions")
    assert disc_list_res.status_code == status.HTTP_200_OK
    discussions = disc_list_res.json()
    assert len(discussions) == 3
    # Check that newest is first
    assert discussions[0]["note"] == "Discussion 3: Contract review"
    assert discussions[1]["note"] == "Discussion 2: Follow-up check"
    assert discussions[2]["note"] == "Discussion 1: Initial call"


def test_discussion_validation_empty_note(client):
    create_res = client.post("/api/v1/leads", json={"name": "Arthur Curry"})
    lead_id = create_res.json()["id"]

    res = client.post(
        f"/api/v1/leads/{lead_id}/discussions",
        json={"note": "   "},
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
