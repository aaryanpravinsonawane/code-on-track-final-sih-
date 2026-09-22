import pandas as pd

from app.services.data_processor import aggregate, frame_records, store


def get_tms_analytics(frame: pd.DataFrame | None = None) -> dict:
    tracks = frame.copy() if frame is not None else store.get("tracks")
    if tracks.empty:
        return {"kpis": {"track_utilization_percent": 0, "available_tracks": 0, "maintenance_due_tracks": 0, "track_performance_score": 0}, "charts": {"utilization": [], "status": []}}
    tracks["utilization_percent"] = (tracks["usage_hours"] / tracks["available_hours"].clip(lower=1) * 100).clip(upper=100).round(2)
    status = aggregate(tracks, "status", {"track_id": "count", "utilization_percent": "mean"}).rename(columns={"track_id": "count", "utilization_percent": "utilization"})
    return {"kpis": {"track_utilization_percent": round(float(tracks["utilization_percent"].mean()), 2), "available_tracks": int((tracks["status"] == "Operational").sum()), "maintenance_due_tracks": int(tracks["maintenance_due"].sum()), "track_performance_score": round(float(tracks["performance_score"].mean()), 2)}, "charts": {"utilization": frame_records(tracks[["track_id", "utilization_percent", "section"]].head(100)), "status": frame_records(status)}}
