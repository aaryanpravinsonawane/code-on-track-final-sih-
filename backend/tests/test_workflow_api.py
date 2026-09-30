import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.workflow_store import _demo_state, workflow_store


@pytest.fixture(autouse=True)
def reset_workflow_state():
    workflow_store.transact(lambda state: state.update(_demo_state()))


def token_for(client: TestClient, role: str) -> dict[str, str]:
    response = client.post(
        "/api/auth/token",
        json={"username": f"{role}-TEST", "password": "change-me", "role": role},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_block_approval_lifecycle_enforces_roles_and_records_audit():
    client = TestClient(app)
    tms = token_for(client, "TMS Officer")
    station_master = token_for(client, "Station Master")
    coa = token_for(client, "COA Controller")
    drm = token_for(client, "DRM")
    engineer = token_for(client, "Maintenance Engineer")

    denied = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=tms,
        json={"action": "sanction"},
    )
    assert denied.status_code == 403

    trimmed = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=station_master,
        json={"action": "trim", "trimmed_duration_minutes": 60, "note": "Shortened work scope"},
    )
    assert trimmed.status_code == 200
    assert trimmed.json()["status"] == "AI Validated"
    assert trimmed.json()["duration_minutes"] == 60

    review = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=coa,
        json={"action": "review"},
    )
    assert review.json()["status"] == "Pending Control Review"
    sanction = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=drm,
        json={"action": "sanction", "note": "Reviewed for demonstration"},
    )
    assert sanction.json()["status"] == "Sanctioned"

    dispatch = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=station_master,
        json={"action": "dispatch"},
    )
    assert dispatch.json()["status"] == "Dispatched"
    denied_start = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=station_master,
        json={"action": "start"},
    )
    assert denied_start.status_code == 403
    start = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=engineer,
        json={"action": "start"},
    )
    assert start.json()["status"] == "In Progress"
    complete = client.post(
        "/api/workflow/blocks/BLK-ENG-011/transition",
        headers=engineer,
        json={"action": "complete"},
    )
    assert complete.json()["status"] == "Completed"

    verification = client.get("/api/workflow/audit/verify", headers=drm)
    assert verification.json()["valid"] is True
    assert verification.json()["verified_events"] >= 8


def test_department_request_scope_and_window_validation():
    client = TestClient(app)
    tms = token_for(client, "TMS Officer")
    request = {
        "title": "Demo rail inspection",
        "department": "Engineering",
        "section": "S1",
        "track": "UP-MAIN",
        "window_start": 600,
        "window_end": 720,
        "duration_minutes": 60,
        "resources": ["Track Gang A"],
        "urgency": 8,
        "priority": 4,
        "tsr_required": True,
        "bundle_key": "S1-UP-MAIN-AM",
    }
    created = client.post("/api/workflow/blocks", headers=tms, json=request)
    assert created.status_code == 201
    assert created.json()["status"] == "Draft"

    wrong_department = client.post(
        "/api/workflow/blocks",
        headers=tms,
        json={**request, "department": "S&T"},
    )
    assert wrong_department.status_code == 403

    impossible = client.post(
        "/api/workflow/blocks",
        headers=tms,
        json={**request, "duration_minutes": 180},
    )
    assert impossible.status_code == 422


def test_field_disruption_creates_issue_replans_and_updates_audit():
    client = TestClient(app)
    engineer = token_for(client, "Maintenance Engineer")
    response = client.post(
        "/api/workflow/field-reports",
        headers=engineer,
        json={
            "event_type": "Machine Breakdown",
            "asset": "TAMP-04",
            "work_package_id": "WP-ENG-17",
            "severity": "CRITICAL",
            "event_time": "2026-09-30T09:00:00Z",
            "remarks": "Power unit failure during readiness check.",
            "location": "S2 · KM 61/2",
            "block_id": "BLK-SNT-021",
        },
    )

    assert response.status_code == 201
    result = response.json()
    assert result["report"]["reported_by"] == "Maintenance Engineer-TEST"
    assert result["issue"]["source"] == "SMMS"
    assert result["schedule_impact"]["solver_mode"] == "ortools-cp-sat"
    assert result["schedule_impact"]["solver_status"] in {"OPTIMAL", "FEASIBLE"}

    snapshot = client.get("/api/workflow/snapshot", headers=engineer).json()
    related = next(block for block in snapshot["block_requests"] if block["id"] == "BLK-SNT-021")
    assert related["replan_required"] is True
    assert snapshot["issues"][0]["id"] == result["issue"]["id"]
    assert client.get("/api/workflow/audit/verify", headers=engineer).json()["valid"] is True