from app.ai.conflict_detector import detect_conflicts
from app.ai.platform_allocator import allocate_platforms
from app.ai.track_allocator import allocate_tracks


def optimize_operations(trains: list[dict], platforms: list[str], tracks: list[str], safety_distance_minutes: int = 5) -> dict:
    platform_results = allocate_platforms(trains, platforms)
    indexed = {item["train_id"]: item for item in platform_results}
    with_platforms = [{**train, **indexed[train["train_id"]]} for train in trains]
    track_results = allocate_tracks(with_platforms, tracks, safety_distance_minutes)
    indexed_tracks = {item["train_id"]: item for item in track_results}
    assigned = [{**train, **indexed_tracks[train["train_id"]]} for train in with_platforms]
    conflicts = detect_conflicts(assigned)
    return {"assignments": assigned, "conflicts": conflicts, "optimization_score": round(max(0, 100 - len(conflicts) * 8), 1)}
