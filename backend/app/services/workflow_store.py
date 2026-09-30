from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime, timedelta
from hashlib import sha256
import json
from threading import RLock
from typing import Any, Callable
from uuid import uuid4

from sqlalchemy import Column, DateTime, Integer, JSON, MetaData, Table, insert, select, update
from sqlalchemy.dialects.postgresql import JSONB

from app.database.session import get_engine


def _demo_state() -> dict[str, Any]:
    blocks = [
        {"id": "BLK-ENG-014", "title": "Rail weld inspection", "department": "Engineering", "section": "S1", "track": "UP-MAIN", "window_start": 780, "window_end": 900, "duration_minutes": 60, "resources": ["Track Gang A"], "urgency": 9, "priority": 5, "tsr_required": True, "bundle_key": "S1-UP-MAIN-DAY", "requested_by": "TMS-001", "status": "Draft", "replan_required": False},
        {"id": "BLK-SNT-021", "title": "Track circuit relay replacement", "department": "S&T", "section": "S2", "track": "DN-MAIN", "window_start": 750, "window_end": 870, "duration_minutes": 60, "resources": ["Signal Crew 1"], "urgency": 8, "priority": 4, "tsr_required": False, "bundle_key": "S2-DN-MAIN-DAY", "requested_by": "SMMS-001", "status": "Submitted", "replan_required": False},
        {"id": "BLK-TRD-008", "title": "OHE contact wire check", "department": "TRD", "section": "S1", "track": "UP-MAIN", "window_start": 780, "window_end": 900, "duration_minutes": 45, "resources": ["Tower Wagon", "OHE Crew A"], "urgency": 7, "priority": 4, "tsr_required": True, "bundle_key": "S1-UP-MAIN-DAY", "requested_by": "TDMS-001", "status": "AI Validated", "replan_required": False},
        {"id": "BLK-ENG-011", "title": "Turnout renewal Pt 12A", "department": "Engineering", "section": "S1", "track": "UP-MAIN", "window_start": 990, "window_end": 1080, "duration_minutes": 75, "resources": ["Track Gang B", "Crane"], "urgency": 10, "priority": 5, "tsr_required": True, "bundle_key": "S1-UP-MAIN-EVE", "requested_by": "TMS-001", "status": "Pending Control Review", "replan_required": False},
        {"id": "BLK-SNT-019", "title": "Signal lamp renewal", "department": "S&T", "section": "S3", "track": "LOOP-1", "window_start": 795, "window_end": 915, "duration_minutes": 45, "resources": ["Signal Crew 2"], "urgency": 6, "priority": 3, "tsr_required": False, "bundle_key": "S3-LOOP-1-DAY", "requested_by": "SMMS-001", "status": "Sanctioned", "replan_required": False},
        {"id": "BLK-TRD-004", "title": "Feeder isolation inspection", "department": "TRD", "section": "S2", "track": "DN-MAIN", "window_start": 1020, "window_end": 1140, "duration_minutes": 60, "resources": ["OHE Crew B"], "urgency": 5, "priority": 3, "tsr_required": False, "bundle_key": "S2-DN-MAIN-EVE", "requested_by": "TDMS-001", "status": "Rejected", "replan_required": False},
        {"id": "BLK-ENG-017", "title": "Ballast screening", "department": "Engineering", "section": "S3", "track": "UP-MAIN", "window_start": 1320, "window_end": 1440, "duration_minutes": 90, "resources": ["Tamping Machine", "Track Gang A"], "urgency": 8, "priority": 4, "tsr_required": True, "bundle_key": "S3-UP-MAIN-NIGHT", "requested_by": "TMS-001", "status": "In Progress", "replan_required": False},
    ]
    issues = [
        {"id": "ISS-DEMO-101", "source": "TMS", "severity": "CRITICAL", "location": "S1 · KM 104/7", "description": "Rail weld inspection is overdue; temporary speed restriction required for the simulated corridor.", "created_at": "2026-09-30T07:10:00Z", "status": "Open", "assigned_department": "Engineering", "recommended_action": "Review the S1 request and confirm the TSR plan."},
        {"id": "ISS-DEMO-102", "source": "SMMS", "severity": "HIGH", "location": "S2 · Karimpur", "description": "Intermittent track circuit indication requires a signal crew inspection.", "created_at": "2026-09-30T07:24:00Z", "status": "Assigned", "assigned_department": "S&T", "recommended_action": "Confirm isolation and schedule a relay replacement."},
        {"id": "ISS-DEMO-103", "source": "TDMS", "severity": "MEDIUM", "location": "S1 · OHE span 44/8", "description": "Tower wagon availability is reduced for the next maintenance window.", "created_at": "2026-09-30T07:40:00Z", "status": "Open", "assigned_department": "TRD", "recommended_action": "Re-run the resource-feasible block schedule."},
        {"id": "ISS-DEMO-104", "source": "Station Master", "severity": "HIGH", "location": "NDG Station · Platform 2", "description": "Simulated platform occupancy overlaps the proposed station work window.", "created_at": "2026-09-30T07:56:00Z", "status": "In Progress", "assigned_department": "Operations", "recommended_action": "Coordinate the window with the section controller."},
        {"id": "ISS-DEMO-105", "source": "COA", "severity": "LOW", "location": "Central Control", "description": "A draft request is awaiting controller review before approval.", "created_at": "2026-09-30T08:03:00Z", "status": "Open", "assigned_department": "Operations", "recommended_action": "Complete review and record the decision."},
    ]
    audit = []
    previous_hash = "0" * 64
    for index, action in enumerate(("Demo data loaded", "Control review recorded"), start=1):
        event = {
            "id": f"EVT-DEMO-{index:03d}",
            "timestamp": (datetime(2026, 9, 30, 7, 0, tzinfo=UTC) + timedelta(minutes=index)).isoformat(),
            "user": "DEMO-SYSTEM",
            "role": "Admin",
            "entity_id": "DEMO",
            "action": action,
            "previous_state": None,
            "new_state": {"mode": "SIMULATED"},
            "previous_hash": previous_hash,
        }
        event["integrity_hash"] = sha256(
            json.dumps(event, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        previous_hash = event["integrity_hash"]
        audit.append(event)
    return {
        "demo_mode": True,
        "block_requests": blocks,
        "issues": issues,
        "field_reports": [
            {
                "id": "FLD-DEMO-001",
                "event_type": "Machine Unavailable",
                "asset": "TAMP-04",
                "work_package_id": "WP-ENG-17",
                "severity": "HIGH",
                "event_time": "2026-09-30T06:45:00Z",
                "remarks": "Tamping machine unavailable during pre-block inspection.",
                "location": "S3 · KM 128/4",
                "block_id": "BLK-ENG-017",
                "reported_by": "MNT-001",
                "received_at": "2026-09-30T06:47:00Z",
            }
        ],
        "audit": audit,
        "last_optimization": None,
        "train_paths": [
            {"id": "12951", "section": "S1", "start": 360, "end": 392, "priority": 1},
            {"id": "12615", "section": "S1", "start": 425, "end": 459, "priority": 2},
            {"id": "12841", "section": "S2", "start": 380, "end": 415, "priority": 1},
            {"id": "12903", "section": "S3", "start": 345, "end": 378, "priority": 1},
        ],
    }


class WorkflowStore:
    def __init__(self) -> None:
        self._lock = RLock()
        self._state = _demo_state()
        self._engine = get_engine()
        self._table = None
        if self._engine is not None:
            metadata = MetaData()
            self._table = Table(
                "trackwise_workflow_state",
                metadata,
                Column("id", Integer, primary_key=True),
                Column("payload", JSON().with_variant(JSONB, "postgresql"), nullable=False),
                Column("updated_at", DateTime(timezone=True), nullable=False),
            )
            metadata.create_all(self._engine)
            with self._engine.begin() as connection:
                stored = connection.execute(select(self._table.c.payload).where(self._table.c.id == 1)).scalar_one_or_none()
                if stored is None:
                    connection.execute(insert(self._table).values(id=1, payload=self._state, updated_at=datetime.now(UTC)))
                else:
                    self._state = stored

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return deepcopy(self._state)

    def transact(self, operation: Callable[[dict[str, Any]], Any]) -> Any:
        with self._lock:
            next_state = deepcopy(self._state)
            result = operation(next_state)
            if self._engine is not None and self._table is not None:
                with self._engine.begin() as connection:
                    connection.execute(
                        update(self._table)
                        .where(self._table.c.id == 1)
                        .values(payload=next_state, updated_at=datetime.now(UTC))
                    )
            self._state = next_state
            return deepcopy(result)


workflow_store = WorkflowStore()