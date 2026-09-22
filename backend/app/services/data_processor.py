from __future__ import annotations

from typing import Any, Iterable

import numpy as np
import pandas as pd


class RailwayDataStore:
    """In-process analytics cache; replace the frame loader with a DB adapter in production."""

    def __init__(self) -> None:
        self.frames: dict[str, pd.DataFrame] = generate_sample_data()

    def get(self, name: str) -> pd.DataFrame:
        return self.frames.get(name, pd.DataFrame()).copy()

    def replace(self, name: str, frame: pd.DataFrame) -> None:
        self.frames[name] = clean_dataframe(frame)



def clean_dataframe(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result.columns = [str(column).strip().lower().replace(" ", "_") for column in result.columns]
    result = result.replace([np.inf, -np.inf], np.nan).drop_duplicates()
    for column in result.columns:
        if pd.api.types.is_numeric_dtype(result[column]):
            result[column] = result[column].fillna(result[column].median() if result[column].notna().any() else 0)
            result[column] = pd.to_numeric(result[column], downcast="integer" if pd.api.types.is_integer_dtype(result[column]) else "float")
        else:
            result[column] = result[column].fillna("Unknown").astype("string")
    return result


def aggregate(frame: pd.DataFrame, group_by: str | list[str], metrics: dict[str, str]) -> pd.DataFrame:
    if frame.empty:
        return pd.DataFrame()
    return frame.groupby(group_by, dropna=False, observed=True).agg(metrics).reset_index()


def rolling_average(frame: pd.DataFrame, value_column: str, window: int = 7) -> pd.Series:
    if value_column not in frame.columns:
        return pd.Series(dtype="float64")
    return frame[value_column].rolling(window=window, min_periods=1).mean().round(2)


def frame_records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    return frame.replace({np.nan: None}).to_dict(orient="records")


def generate_sample_data(seed: int = 42) -> dict[str, pd.DataFrame]:
    rng = np.random.default_rng(seed)
    dates = pd.date_range(end=pd.Timestamp.now(tz="UTC").normalize(), periods=30, freq="D")
    tracks = pd.DataFrame({
        "track_id": [f"T{i:03d}" for i in range(1, 101)],
        "section": rng.choice(["S1", "S2", "S3", "S4"], 100),
        "status": rng.choice(["Operational", "Restricted", "Maintenance"], 100, p=[0.78, 0.14, 0.08]),
        "usage_hours": rng.uniform(4, 23, 100).round(2),
        "available_hours": 24,
        "maintenance_due": rng.choice([True, False], 100, p=[0.18, 0.82]),
        "performance_score": rng.uniform(62, 99, 100).round(1),
    })
    signals = pd.DataFrame({
        "signal_id": [f"SIG-{i:03d}" for i in range(1, 201)],
        "section": rng.choice(["S1", "S2", "S3", "S4"], 200),
        "health": rng.choice(["Healthy", "Degraded", "Fault"], 200, p=[0.82, 0.13, 0.05]),
        "failure_count": rng.poisson(0.7, 200),
        "maintenance_efficiency": rng.uniform(65, 100, 200).round(1),
        "last_maintenance_days": rng.integers(1, 120, 200),
    })
    substations = pd.DataFrame({
        "substation_id": [f"SUB-{i:02d}" for i in range(1, 21)],
        "status": rng.choice(["Online", "Degraded", "Offline"], 20, p=[0.85, 0.1, 0.05]),
        "load_mw": rng.uniform(12, 92, 20).round(2),
        "voltage_kv": rng.normal(25, 0.6, 20).round(2),
        "capacity_mw": 100,
    })
    power = pd.DataFrame({
        "timestamp": rng.choice(dates, 1000),
        "substation_id": rng.choice(substations["substation_id"], 1000),
        "consumption_mwh": rng.uniform(8, 90, 1000).round(2),
        "load_mw": rng.uniform(12, 98, 1000).round(2),
        "voltage_kv": rng.normal(25, 0.8, 1000).round(2),
    }).sort_values("timestamp")
    issues = pd.DataFrame({
        "issue_id": [f"ISS-{i:04d}" for i in range(1, 1001)],
        "created_at": rng.choice(dates, 1000),
        "department": rng.choice(["Engineering", "S&T", "TRD"], 1000),
        "status": rng.choice(["Open", "Investigating", "Resolved"], 1000, p=[0.25, 0.2, 0.55]),
        "severity": rng.choice(["Low", "Medium", "High", "Critical"], 1000, p=[0.35, 0.4, 0.2, 0.05]),
    })
    operations = pd.DataFrame({
        "operation_id": [f"OP-{i:05d}" for i in range(1, 1001)],
        "operation_date": rng.choice(dates, 1000),
        "department": rng.choice(["TMS", "SMMS", "TDMS"], 1000),
        "duration_minutes": rng.integers(10, 240, 1000),
        "delay_minutes": rng.poisson(8, 1000),
    })
    return {name: clean_dataframe(frame) for name, frame in {"tracks": tracks, "signals": signals, "substations": substations, "power": power, "issues": issues, "operations": operations}.items()}


store = RailwayDataStore()
