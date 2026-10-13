import uuid
from fastapi import status


def test_create_lead_success(client):
    payload = {
        "name": "Bruce Wayne",
        "company": "Wayne Enterprises",
        "phone": "555-0199",
    }
    response = client.post("/api/v1/leads", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Bruce Wayne"
    assert data["company"] == "Wayne Enterprises"
    assert data["phone"] == "555-0199"
    assert data["status"] == "New"
    assert "id" in data
    # Ensure ID is a valid UUID
    uuid.UUID(data["id"])


def test_create_lead_validation_empty_name(client):
    payload = {"name": "   ", "company": "Acme"}
    response = client.post("/api/v1/leads", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_create_lead_invalid_status(client):
    payload = {"name": "Clark Kent", "status": "NonExistentStatus"}
    response = client.post("/api/v1/leads", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_lead_not_found(client):
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/leads/{random_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_lead_status(client):
    # Create lead
    create_res = client.post("/api/v1/leads", json={"name": "Diana Prince"})
    assert create_res.status_code == status.HTTP_201_CREATED
    lead_id = create_res.json()["id"]

    # Update status to Qualified
    update_res = client.patch(
        f"/api/v1/leads/{lead_id}", json={"status": "Qualified"}
    )
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["status"] == "Qualified"


def test_search_and_filter_leads(client):
    client.post("/api/v1/leads", json={"name": "Alice Johnson", "status": "New"})
    client.post("/api/v1/leads", json={"name": "Bob Smith", "status": "Contacted"})
    client.post("/api/v1/leads", json={"name": "Alice Cooper", "status": "Contacted"})

    # Search by name "Alice"
    res = client.get("/api/v1/leads?query=Alice")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) >= 2
    for l in data:
        assert "Alice" in l["name"]

    # Filter by status "Contacted"
    res_status = client.get("/api/v1/leads?status=Contacted")
    assert res_status.status_code == status.HTTP_200_OK
    for l in res_status.json():
        assert l["status"] == "Contacted"

    # Combined search and status filter
    res_comb = client.get("/api/v1/leads?query=Alice&status=Contacted")
    assert res_comb.status_code == status.HTTP_200_OK
    names = [l["name"] for l in res_comb.json()]
    assert "Alice Cooper" in names
    assert "Alice Johnson" not in names


def test_stats_summary(client):
    client.post("/api/v1/leads", json={"name": "Lead Won 1", "status": "Won"})
    client.post("/api/v1/leads", json={"name": "Lead Won 2", "status": "Won"})

    res = client.get("/api/v1/leads/stats/summary")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "total_leads" in data
    assert "follow_ups_today" in data
    assert "overdue_follow_ups" in data
    assert "won_leads" in data
    assert data["won_leads"] >= 2
