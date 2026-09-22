from itertools import combinations


def _overlap(left: dict, right: dict) -> bool:
    return int(left["arrival_time"]) < int(right["departure_time"]) and int(right["arrival_time"]) < int(left["departure_time"])


def detect_conflicts(trains: list[dict]) -> list[dict]:
    conflicts = []
    for left, right in combinations(trains, 2):
        if not _overlap(left, right):
            continue
        if left.get("assigned_platform") and left.get("assigned_platform") == right.get("assigned_platform"):
            conflicts.append({"conflict_type": "Platform", "severity": "High", "train_ids": [left["train_id"], right["train_id"]], "suggested_solution": f"Move Train {right['train_id']} to another platform"})
        if left.get("assigned_track") and left.get("assigned_track") == right.get("assigned_track"):
            conflicts.append({"conflict_type": "Track", "severity": "Critical", "train_ids": [left["train_id"], right["train_id"]], "suggested_solution": f"Resequence Train {right['train_id']} or assign another track"})
        if left.get("route") and left.get("route") == right.get("route"):
            conflicts.append({"conflict_type": "Route", "severity": "High", "train_ids": [left["train_id"], right["train_id"]], "suggested_solution": "Apply route separation and safety headway"})
        if left.get("section") and left.get("section") == right.get("section"):
            conflicts.append({"conflict_type": "Timing", "severity": "Medium", "train_ids": [left["train_id"], right["train_id"]], "suggested_solution": "Adjust departure timing to remove overlap"})
    return conflicts
