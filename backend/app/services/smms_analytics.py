import pandas as pd

from app.services.data_processor import aggregate, frame_records, store


def get_smms_analytics(frame: pd.DataFrame | None = None) -> dict:
    signals = frame.copy() if frame is not None else store.get("signals")
    if signals.empty:
        return {"kpis": {"signal_health_percent": 0, "fault_frequency": 0, "maintenance_efficiency": 0}, "charts": {"health": [], "failures": []}}
    health = aggregate(signals, "health", {"signal_id": "count", "failure_count": "sum"}).rename(columns={"signal_id": "count"})
    failures = signals.groupby("section", observed=True).agg(faults=("failure_count", "sum"), signals=("signal_id", "count")).reset_index()
    failures["fault_frequency"] = (failures["faults"] / failures["signals"].clip(lower=1)).round(2)
    return {"kpis": {"signal_health_percent": round(float((signals["health"] == "Healthy").mean() * 100), 2), "fault_frequency": round(float(signals["failure_count"].mean()), 2), "maintenance_efficiency": round(float(signals["maintenance_efficiency"].mean()), 2)}, "charts": {"health": frame_records(health), "failures": frame_records(failures)}}
