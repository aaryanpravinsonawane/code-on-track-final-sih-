import pandas as pd

from app.services.data_processor import aggregate, frame_records, store


def get_tdms_analytics(power_frame: pd.DataFrame | None = None, substation_frame: pd.DataFrame | None = None) -> dict:
    power = power_frame.copy() if power_frame is not None else store.get("power")
    substations = substation_frame.copy() if substation_frame is not None else store.get("substations")
    if power.empty:
        return {"kpis": {"total_power_usage": 0, "peak_load": 0, "average_consumption": 0, "efficiency_score": 0}, "charts": {"consumption": [], "load_distribution": []}}
    daily = power.groupby("timestamp", observed=True).agg(consumption=("consumption_mwh", "sum"), peak_load=("load_mw", "max")).reset_index().sort_values("timestamp")
    daily["rolling_consumption"] = daily["consumption"].rolling(7, min_periods=1).mean().round(2)
    capacity = float(substations["capacity_mw"].sum()) if not substations.empty else 2000
    efficiency = max(0, min(100, 100 - (float(power["load_mw"].mean()) / max(capacity / max(len(substations), 1), 1) * 10)))
    return {"kpis": {"total_power_usage": round(float(power["consumption_mwh"].sum()), 2), "peak_load": round(float(power["load_mw"].max()), 2), "average_consumption": round(float(power["consumption_mwh"].mean()), 2), "efficiency_score": round(efficiency, 2)}, "charts": {"consumption": frame_records(daily), "load_distribution": frame_records(aggregate(substations, "status", {"load_mw": "mean", "substation_id": "count"}).rename(columns={"substation_id": "count"}))}}
