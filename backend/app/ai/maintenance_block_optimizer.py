from __future__ import annotations

from collections import defaultdict
from itertools import combinations
from typing import Any

try:
    from ortools.sat.python import cp_model
except ImportError:  # The API can still serve demo data when the optional solver is absent.
    cp_model = None


def _overlaps(first_start: int, first_end: int, second_start: int, second_end: int) -> bool:
    return first_start < second_end and second_start < first_end


def _can_bundle(first: dict[str, Any], second: dict[str, Any]) -> bool:
    return bool(
        first.get("bundle_key")
        and first.get("bundle_key") == second.get("bundle_key")
        and first["section"] == second["section"]
        and first["track"] == second["track"]
        and first["department"] != second["department"]
        and set(first.get("resources", []).copy()).isdisjoint(second.get("resources", []))
    )


def _empty_result(reason: str) -> dict[str, Any]:
    return {
        "solver_mode": "unavailable",
        "solver_status": "NOT_RUN",
        "schedule": [],
        "bundles": [],
        "unscheduled": [],
        "conflicts": {"overlapping_blocks": [], "train_paths": [], "resources": [], "impossible_windows": []},
        "reasoning": [reason],
        "metrics": {"scheduled": 0, "train_conflicts_avoided": 0, "resource_utilization": 0},
    }


def optimize_maintenance_blocks(payload: dict[str, Any]) -> dict[str, Any]:
    """Schedule maintenance requests with CP-SAT; every train path is a hard constraint."""
    if cp_model is None:
        return _empty_result("OR-Tools is not installed; no solver result was generated.")

    requests = payload.get("requests", [])
    trains = payload.get("trains", [])
    if not requests:
        return _empty_result("No maintenance requests were supplied.")

    safety_buffer = int(payload.get("safety_buffer_minutes", 10))
    slot_minutes = int(payload.get("slot_minutes", 15))
    if safety_buffer < 0 or not 1 <= slot_minutes <= 60:
        raise ValueError("Safety buffer must be non-negative and slot size must be 1-60 minutes.")

    model = cp_model.CpModel()
    candidates: list[dict[str, Any]] = []
    candidates_by_request: dict[int, list[int]] = defaultdict(list)
    train_blocked_requests: set[int] = set()

    for request_index, request in enumerate(requests):
        duration = int(request["duration_minutes"])
        window_start = int(request["window_start"])
        window_end = int(request["window_end"])
        if duration <= 0 or window_end <= window_start:
            raise ValueError(f"Invalid window or duration for request {request['id']}.")

        relevant_trains = [train for train in trains if train["section"] == request["section"]]
        starts = range(window_start, window_end - duration + 1, slot_minutes)
        for start in starts:
            end = start + duration
            blocking_trains = [
                train
                for train in relevant_trains
                if _overlaps(
                    start,
                    end,
                    int(train["start"]) - safety_buffer,
                    int(train["end"]) + safety_buffer,
                )
            ]
            if blocking_trains:
                train_blocked_requests.add(request_index)
                continue

            selected = model.new_bool_var(f"request_{request_index}_at_{start}")
            candidates_by_request[request_index].append(len(candidates))
            candidates.append(
                {
                    "request_index": request_index,
                    "request": request,
                    "start": start,
                    "end": end,
                    "selected": selected,
                }
            )

    for indices in candidates_by_request.values():
        model.add_at_most_one(candidates[index]["selected"] for index in indices)

    conflict_pairs: set[tuple[int, int]] = set()
    for first_index, second_index in combinations(range(len(candidates)), 2):
        first = candidates[first_index]
        second = candidates[second_index]
        if first["request_index"] == second["request_index"]:
            continue
        first_request = first["request"]
        second_request = second["request"]
        if not _overlaps(first["start"], first["end"], second["start"], second["end"]):
            continue

        shared_resource = not set(first_request.get("resources", [])).isdisjoint(
            second_request.get("resources", [])
        )
        can_share_block = (
            first["start"] == second["start"]
            and _can_bundle(first_request, second_request)
        )
        same_section = first_request["section"] == second_request["section"]
        if shared_resource or (same_section and not can_share_block):
            model.add(first["selected"] + second["selected"] <= 1)
            conflict_pairs.add((first_index, second_index))

    objective_terms = []
    for candidate in candidates:
        request = candidate["request"]
        priority = max(1, min(5, int(request.get("priority", 3))))
        urgency = max(1, min(10, int(request.get("urgency", 5))))
        objective_terms.append((priority * 100 + urgency * 10) * candidate["selected"])
    model.maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max(0.1, min(30.0, float(payload.get("time_limit_seconds", 5))))
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            **_empty_result("CP-SAT found no feasible maintenance schedule."),
            "solver_mode": "ortools-cp-sat",
            "solver_status": solver.status_name(status),
        }

    selected_candidates = [candidate for candidate in candidates if solver.value(candidate["selected"])]
    selected_candidates.sort(key=lambda candidate: (candidate["start"], candidate["request"]["section"]))

    bundle_groups: dict[tuple[str, str, int, str], list[dict[str, Any]]] = defaultdict(list)
    for candidate in selected_candidates:
        request = candidate["request"]
        bundle_key = request.get("bundle_key") or request["id"]
        bundle_groups[(request["section"], request["track"], candidate["start"], bundle_key)].append(candidate)

    schedule: list[dict[str, Any]] = []
    bundles: list[dict[str, Any]] = []
    for bundle_number, ((section, track, start, _), group) in enumerate(bundle_groups.items(), start=1):
        bundle_id = f"BND-{bundle_number:03d}"
        end = max(candidate["end"] for candidate in group)
        rows = []
        for candidate in group:
            request = candidate["request"]
            row = {
                "request_id": request["id"],
                "department": request["department"],
                "section": section,
                "track": track,
                "start": candidate["start"],
                "end": candidate["end"],
                "duration_minutes": candidate["end"] - candidate["start"],
                "resources": request.get("resources", []),
                "bundle_id": bundle_id,
                "reasons": [
                    "Selected by CP-SAT within the requested time window.",
                    "Train occupancy and safety buffers were enforced as hard constraints.",
                ],
            }
            schedule.append(row)
            rows.append(row)
        bundles.append(
            {
                "id": bundle_id,
                "section": section,
                "track": track,
                "start": start,
                "end": end,
                "request_ids": [row["request_id"] for row in rows],
                "departments": sorted({row["department"] for row in rows}),
            }
        )

    selected_ids = {row["request_id"] for row in schedule}
    unscheduled = []
    for index, request in enumerate(requests):
        if request["id"] in selected_ids:
            continue
        if not candidates_by_request[index] and index in train_blocked_requests:
            reason = "No candidate slot clears all train paths and safety buffers."
        elif not candidates_by_request[index]:
            reason = "The requested duration does not fit inside its time window."
        else:
            reason = "No conflict-free slot remained for the available track and resources."
        unscheduled.append({"request_id": request["id"], "reason": reason})

    original_train_conflicts = 0
    for request in requests:
        preferred_start = int(request.get("preferred_start", request["window_start"]))
        preferred_end = preferred_start + int(request["duration_minutes"])
        original_train_conflicts += sum(
            1
            for train in trains
            if train["section"] == request["section"]
            and _overlaps(
                preferred_start,
                preferred_end,
                int(train["start"]) - safety_buffer,
                int(train["end"]) + safety_buffer,
            )
        )

    resource_minutes: dict[str, int] = defaultdict(int)
    for row in schedule:
        for resource in row["resources"]:
            resource_minutes[resource] += row["duration_minutes"]
    total_resource_minutes = sum(resource_minutes.values())
    occupied_minutes = sum(bundle["end"] - bundle["start"] for bundle in bundles)

    return {
        "solver_mode": "ortools-cp-sat",
        "solver_status": solver.status_name(status),
        "schedule": schedule,
        "bundles": bundles,
        "unscheduled": unscheduled,
        "conflicts": {
            "overlapping_blocks": [],
            "train_paths": [
                {"request_id": request["id"], "train_id": train["id"]}
                for request in requests
                for train in trains
                if train["section"] == request["section"]
                and _overlaps(
                    int(request.get("preferred_start", request["window_start"])),
                    int(request.get("preferred_start", request["window_start"]))
                    + int(request["duration_minutes"]),
                    int(train["start"]) - safety_buffer,
                    int(train["end"]) + safety_buffer,
                )
            ],
            "resources": [
                {"first": requests[candidates[first]["request_index"]]["id"], "second": requests[candidates[second]["request_index"]]["id"]}
                for first, second in conflict_pairs
                if set(candidates[first]["request"].get("resources", [])).intersection(
                    candidates[second]["request"].get("resources", [])
                )
            ],
            "impossible_windows": [item["request_id"] for item in unscheduled if "does not fit" in item["reason"]],
        },
        "reasoning": [
            f"CP-SAT returned {solver.status_name(status)} after an actual solver run.",
            "Train paths and configured safety buffers are hard constraints.",
            "Compatible requests share a bundle only when department, track, start, bundle key, and resource conditions allow it.",
            f"Scheduled {len(schedule)} of {len(requests)} requests; {len(bundles)} block bundle(s) are approval candidates.",
        ],
        "metrics": {
            "scheduled": len(schedule),
            "train_conflicts_avoided": original_train_conflicts,
            "resource_utilization": round(total_resource_minutes / occupied_minutes * 100) if occupied_minutes else 0,
        },
    }