from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
import json
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.ai.maintenance_block_optimizer import optimize_maintenance_blocks
from app.routes.auth import current_user, require_roles
from app.services.workflow_store import workflow_store


router = APIRouter(prefix="/workflow", tags=["operational workflow"])

RoleName = Literal[
    "Admin",
    "Station Master",
    "TMS Officer",
    "SMMS Officer",
    "TDMS Officer",
    "COA Controller",
    "DRM",
    "Maintenance Engineer",
]
Department = Literal["Engineering", "S&T", "TRD"]
EventType = Literal[
    "Machine Breakdown",
    "Machine Unavailable",
    "Material Delayed",
    "Crew Unavailable",
    "Work Started",
    "Work Delayed",
    "Work Completed Early",
]


class BlockDemandInput(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    department: Department
    section: str = Field(min_length=1, max_length=20)
    track: str = Field(min_length=1, max_length=60)
    window_start: int = Field(ge=0, le=1440)
    window_end: int = Field(gt=0, le=1440)
    duration_minutes: int = Field(gt=0, le=1440)
    resources: list[str] = Field(default_factory=list, max_length=20)
    urgency: int = Field(default=5, ge=1, le=10)
    priority: int = Field(default=3, ge=1, le=5)
    tsr_required: bool = False
    bundle_key: str | None = Field(default=None, max_length=80)

    @model_validator(mode="after")
    def validate_window(self):
        if self.window_end <= self.window_start or self.duration_minutes > self.window_end - self.window_start:
            raise ValueError("The duration must fit inside the requested time window.")
        return self


class TransitionInput(BaseModel):
    action: Literal["submit", "validate", "review", "sanction", "trim", "reject", "resubmit", "dispatch", "start", "complete"]
    note: str | None = Field(default=None, max_length=1000)
    trimmed_duration_minutes: int | None = Field(default=None, ge=1, le=1440)


class IssueUpdateInput(BaseModel):
    status: Literal["Open", "Assigned", "In Progress", "Resolved"] | None = None
    assigned_department: str | None = Field(default=None, min_length=2, max_length=80)


class FieldReportInput(BaseModel):
    event_type: EventType
    asset: str = Field(min_length=1, max_length=120)
    work_package_id: str = Field(min_length=1, max_length=80)
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    event_time: datetime
    remarks: str = Field(min_length=3, max_length=2000)
    location: str = Field(min_length=2, max_length=160)
    block_id: str | None = Field(default=None, max_length=80)


REQUEST_ROLES: dict[str, set[str]] = {
    "Engineering": {"TMS Officer", "Maintenance Engineer"},
    "S&T": {"SMMS Officer", "Maintenance Engineer"},
    "TRD": {"TDMS Officer", "Maintenance Engineer"},
}
CONTROL_ROLES = {"Admin", "Station Master", "COA Controller", "DRM"}
ACTION_ROLES: dict[str, set[str]] = {
    "submit": {"Admin", "Station Master", "TMS Officer", "SMMS Officer", "TDMS Officer", "Maintenance Engineer"},
    "validate": {"Admin", "COA Controller"},
    "review": CONTROL_ROLES,
    "sanction": {"Admin", "DRM", "Station Master"},
    "trim": CONTROL_ROLES,
    "reject": CONTROL_ROLES,
    "resubmit": {"Admin", "TMS Officer", "SMMS Officer", "TDMS Officer", "Maintenance Engineer"},
    "dispatch": {"Admin", "Station Master", "COA Controller"},
    "start": {"Admin", "Maintenance Engineer", "TMS Officer", "SMMS Officer", "TDMS Officer"},
    "complete": {"Admin", "Maintenance Engineer", "TMS Officer", "SMMS Officer", "TDMS Officer"},
}
NEXT_STATUS = {
    "submit": {"Draft": "Submitted"},
    "validate": {"Submitted": "AI Validated"},
    "review": {"AI Validated": "Pending Control Review"},
    "sanction": {"Pending Control Review": "Sanctioned"},
    "trim": {"Pending Control Review": "AI Validated"},
    "reject": {"Pending Control Review": "Rejected"},
    "resubmit": {"Rejected": "Submitted"},
    "dispatch": {"Sanctioned": "Dispatched"},
    "start": {"Dispatched": "In Progress"},
    "complete": {"In Progress": "Completed"},
}
FIELD_REPORT_ROLES = {
    "Admin", "Station Master", "TMS Officer", "SMMS Officer", "TDMS Officer", "COA Controller", "Maintenance Engineer"
}


def _append_audit(
    state: dict[str, Any],
    user: dict[str, str],
    entity_id: str,
    action: str,
    previous_state: Any,
    new_state: Any,
) -> dict[str, Any]:
    previous_hash = state["audit"][-1]["integrity_hash"] if state["audit"] else "0" * 64
    event = {
        "id": f"EVT-{uuid4().hex[:12].upper()}",
        "timestamp": datetime.now(UTC).isoformat(),
        "user": user["sub"],
        "role": user["role"],
        "entity_id": entity_id,
        "action": action,
        "previous_state": previous_state,
        "new_state": new_state,
        "previous_hash": previous_hash,
    }
    event["integrity_hash"] = sha256(json.dumps(event, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()
    state["audit"].append(event)
    return event


def _find_block(state: dict[str, Any], block_id: str) -> dict[str, Any]:
    block = next((item for item in state["block_requests"] if item["id"] == block_id), None)
    if block is None:
        raise HTTPException(status_code=404, detail="Block request not found")
    return block


def _validate_department_role(block: dict[str, Any], role: str, action: str) -> None:
    if role in {"Admin", "Station Master"}:
        return
    if role not in REQUEST_ROLES[block["department"]]:
        raise HTTPException(status_code=403, detail=f"{role} cannot {action} {block['department']} requests")


@router.get("/snapshot")
def get_workflow_snapshot(user: dict[str, str] = Depends(current_user)):
    snapshot = workflow_store.snapshot()
    snapshot["active_role"] = user["role"]
    return snapshot


@router.post("/blocks", status_code=201)
def create_block_demand(
    request: BlockDemandInput,
    user: dict[str, str] = Depends(require_roles("Admin", "Station Master", "TMS Officer", "SMMS Officer", "TDMS Officer", "Maintenance Engineer")),
):
    if user["role"] not in {"Admin", "Station Master"}:
        _validate_department_role(request.model_dump(), user["role"], "create")

    def operation(state: dict[str, Any]):
        block = {
            **request.model_dump(),
            "id": f"BLK-{uuid4().hex[:8].upper()}",
            "requested_by": user["sub"],
            "status": "Draft",
            "replan_required": False,
        }
        state["block_requests"].append(block)
        _append_audit(state, user, block["id"], "Block demand created", None, block)
        return block

    return workflow_store.transact(operation)


@router.post("/blocks/{block_id}/transition")
def transition_block(
    block_id: str,
    request: TransitionInput,
    user: dict[str, str] = Depends(current_user),
):
    action = request.action
    if user["role"] not in ACTION_ROLES[action]:
        raise HTTPException(status_code=403, detail=f"{user['role']} cannot perform {action}")

    def operation(state: dict[str, Any]):
        block = _find_block(state, block_id)
        if action in {"submit", "resubmit", "start", "complete"}:
            _validate_department_role(block, user["role"], action)
        before = {"status": block["status"], "duration_minutes": block["duration_minutes"]}
        next_status = NEXT_STATUS[action].get(block["status"])
        if next_status is None:
            raise HTTPException(status_code=409, detail=f"Cannot {action} a block in {block['status']} state")
        if action == "trim":
            trimmed_duration = request.trimmed_duration_minutes
            if trimmed_duration is None or trimmed_duration >= block["duration_minutes"]:
                raise HTTPException(status_code=422, detail="Trim duration must be less than the current duration")
            block["duration_minutes"] = trimmed_duration
            block["replan_required"] = True
        if action == "reject" and not (request.note or "").strip():
            raise HTTPException(status_code=422, detail="A rejection reason is required")
        block["status"] = next_status
        if request.note:
            block["last_action_note"] = request.note
        block["updated_at"] = datetime.now(UTC).isoformat()
        after = {"status": block["status"], "duration_minutes": block["duration_minutes"]}
        _append_audit(state, user, block_id, action, before, after)
        return block

    return workflow_store.transact(operation)


@router.patch("/issues/{issue_id}")
def update_workflow_issue(
    issue_id: str,
    request: IssueUpdateInput,
    user: dict[str, str] = Depends(current_user),
):
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="At least one issue field must be updated")

    def operation(state: dict[str, Any]):
        issue = next((item for item in state["issues"] if item["id"] == issue_id), None)
        if issue is None:
            raise HTTPException(status_code=404, detail="Issue not found")
        source_role = {"TMS": "TMS Officer", "SMMS": "SMMS Officer", "TDMS": "TDMS Officer"}.get(issue["source"])
        if user["role"] not in {"Admin", "Station Master", "DRM", "COA Controller", "Maintenance Engineer", source_role}:
            raise HTTPException(status_code=403, detail="Role cannot assign or update this issue")
        before = {key: issue.get(key) for key in changes}
        issue.update(changes)
        _append_audit(state, user, issue_id, "Issue updated", before, {key: issue.get(key) for key in changes})
        return issue

    return workflow_store.transact(operation)


@router.post("/optimize")
def optimize_blocks(user: dict[str, str] = Depends(current_user)):
    state = workflow_store.snapshot()
    requests = [
        block
        for block in state["block_requests"]
        if block["status"] in {"Submitted", "AI Validated"} or block.get("replan_required")
    ]
    result = optimize_maintenance_blocks(
        {
            "requests": requests,
            "trains": state["train_paths"],
            "safety_buffer_minutes": 10,
            "slot_minutes": 15,
            "time_limit_seconds": 5,
        }
    )

    def operation(current: dict[str, Any]):
        current["last_optimization"] = result
        if result["solver_status"] in {"OPTIMAL", "FEASIBLE"}:
            scheduled_ids = {item["request_id"] for item in result["schedule"]}
            for block in current["block_requests"]:
                if block["id"] in scheduled_ids and block["status"] == "Submitted":
                    before = {"status": block["status"]}
                    block["status"] = "AI Validated"
                    _append_audit(current, user, block["id"], "AI validation passed", before, {"status": block["status"]})
        _append_audit(current, user, "OPTIMIZER", "Maintenance schedule optimized", None, {"solver_status": result["solver_status"], "scheduled": result["metrics"]["scheduled"]})
        return result

    return workflow_store.transact(operation)


@router.post("/field-reports", status_code=201)
def submit_field_report(
    request: FieldReportInput,
    user: dict[str, str] = Depends(require_roles(*FIELD_REPORT_ROLES)),
):
    def operation(state: dict[str, Any]):
        report = {
            **request.model_dump(mode="json"),
            "id": f"FLD-{uuid4().hex[:8].upper()}",
            "reported_by": user["sub"],
            "received_at": datetime.now(UTC).isoformat(),
        }
        linked_block = _find_block(state, request.block_id) if request.block_id else None
        before = {"status": linked_block["status"], "replan_required": linked_block.get("replan_required")} if linked_block else None
        if linked_block and request.event_type == "Work Started" and linked_block["status"] == "Dispatched":
            linked_block["status"] = "In Progress"
        elif linked_block and request.event_type == "Work Completed Early" and linked_block["status"] == "In Progress":
            linked_block["status"] = "Completed"
        elif linked_block:
            linked_block["replan_required"] = True
        state["field_reports"].append(report)
        department_source = {"Engineering": "TMS", "S&T": "SMMS", "TRD": "TDMS"}
        source = department_source.get(linked_block["department"]) if linked_block else None
        source = source or {"TMS Officer": "TMS", "SMMS Officer": "SMMS", "TDMS Officer": "TDMS", "COA Controller": "COA"}.get(user["role"], "Station Master")
        issue = {
            "id": f"ISS-{uuid4().hex[:8].upper()}",
            "source": source,
            "severity": request.severity,
            "location": request.location,
            "description": f"{request.event_type}: {request.remarks}",
            "created_at": report["received_at"],
            "status": "Open",
            "assigned_department": linked_block["department"] if linked_block else "Operations",
            "recommended_action": "Review the field report and run the maintenance block optimizer.",
        }
        state["issues"].insert(0, issue)
        _append_audit(state, user, report["id"], "Field report submitted", None, report)
        if linked_block:
            _append_audit(state, user, linked_block["id"], "Field execution state updated", before, {"status": linked_block["status"], "replan_required": linked_block["replan_required"]})

        active_requests = [
            block
            for block in state["block_requests"]
            if block["status"] in {"Submitted", "AI Validated"} or block.get("replan_required")
        ]
        impact = optimize_maintenance_blocks(
            {
                "requests": active_requests,
                "trains": state["train_paths"],
                "safety_buffer_minutes": 10,
                "slot_minutes": 15,
                "time_limit_seconds": 5,
            }
        )
        state["last_optimization"] = impact
        _append_audit(state, user, "OPTIMIZER", "Disruption replanning completed", None, {"solver_status": impact["solver_status"], "scheduled": impact["metrics"]["scheduled"]})
        return {"report": report, "issue": issue, "schedule_impact": impact}

    return workflow_store.transact(operation)


@router.get("/audit")
def get_audit(user: dict[str, str] = Depends(current_user)):
    return list(reversed(workflow_store.snapshot()["audit"]))


@router.get("/audit/verify")
def verify_audit(user: dict[str, str] = Depends(current_user)):
    events = workflow_store.snapshot()["audit"]
    previous_hash = "0" * 64
    for event in events:
        unhashed = {key: value for key, value in event.items() if key != "integrity_hash"}
        expected = sha256(json.dumps(unhashed, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()
        if event.get("previous_hash") != previous_hash or event.get("integrity_hash") != expected:
            return {"valid": False, "verified_events": 0}
        previous_hash = event["integrity_hash"]
    return {"valid": True, "verified_events": len(events)}