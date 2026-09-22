from typing import Any

import numpy as np
from sklearn.ensemble import RandomForestRegressor

FEATURES = ["traffic_volume", "platform_usage", "incident_count", "train_priority", "historical_delay"]


def _dataset(rows: list[dict[str, Any]] | None) -> tuple[np.ndarray, np.ndarray]:
    source = rows or [{"traffic_volume": i % 12, "platform_usage": (i * 7) % 100, "incident_count": i % 4, "train_priority": (i % 5) + 1, "historical_delay": (i * 3) % 25, "delay_minutes": max(0, (i % 12) * 2 + (i % 4) * 4 - 4)} for i in range(120)]
    x = np.array([[float(row.get(feature, 0)) for feature in FEATURES] for row in source], dtype=float)
    y = np.array([float(row.get("delay_minutes", 0)) for row in source], dtype=float)
    return x, y


def predict_delay(features: dict[str, float], historical_data: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    x, y = _dataset(historical_data)
    model = RandomForestRegressor(n_estimators=80, random_state=42, min_samples_leaf=2, n_jobs=1)
    model.fit(x, y)
    vector = np.array([[float(features.get(feature, 0)) for feature in FEATURES]], dtype=float)
    predicted_minutes = max(0.0, float(model.predict(vector)[0]))
    probability = min(100, round(predicted_minutes / max(10.0, float(np.percentile(y, 90))) * 100))
    risk_level = "High" if probability >= 67 else "Medium" if probability >= 34 else "Low"
    return {"predicted_delay_minutes": round(predicted_minutes, 1), "delay_probability": probability, "risk_level": risk_level, "model": "RandomForestRegressor"}
