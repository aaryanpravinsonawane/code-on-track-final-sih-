import asyncio
import math
from datetime import datetime, timezone
from typing import Any

import pandas as pd
from fastapi import WebSocket


class RailwaySimulation:
    """Deterministic operational simulator ready to be replaced by telemetry adapters."""

    def __init__(self) -> None:
        self.tick = 0

    def snapshot(self) -> dict[str, Any]:
        self.tick += 1
        now = datetime.now(timezone.utc).isoformat()
        trains = self._trains()
        signals = self._signals()
        tracks = self._tracks()
        maintenance = self._maintenance()
        train_frame = pd.DataFrame(trains)
        signal_frame = pd.DataFrame(signals)
        track_frame = pd.DataFrame(tracks)
        kpi = {
            "track_health": round(float((track_frame["health"] >= 90).mean() * 100), 1),
            "signal_health": round(float((signal_frame["status"] != "Red").mean() * 100), 1),
            "operations_efficiency": round(float((train_frame["delay_minutes"] <= 10).mean() * 100), 1),
            "delayed_trains": int((train_frame["delay_minutes"] > 10).sum()),
            "active_blocks": len(maintenance),
            "running_trains": int((train_frame["status"] == "Running").sum()),
            "updated_at": now,
        }
        return {"updated_at": now, "tick": self.tick, "trains": trains, "signals": signals, "tracks": tracks, "maintenance": maintenance, "kpi": kpi}

    def _trains(self) -> list[dict[str, Any]]:
        services = [
            ("22439", "Vande Bharat Express", "Vande Bharat", "NDG", "MRG"),
            ("12951", "Mumbai Rajdhani", "Express", "NDG", "DVR"),
            ("12615", "Grand Trunk Express", "Express", "KRP", "MRG"),
            ("12841", "Coromandel Express", "Express", "STP", "NDG"),
            ("64022", "NDG Suburban EMU", "Express", "NDG", "KRP"),
            ("FR-201", "Central Coal Rake", "Freight", "KRP", "MRG"),
            ("FR-318", "Container Rake", "Freight", "STP", "DVR"),
            ("22119", "Mirgaon Superfast", "Express", "DVR", "NDG"),
        ]
        records = []
        for index, (number, name, category, origin, destination) in enumerate(services):
            position = (self.tick * (7 + index) + index * 31) % 160
            delay = max(0, int(5 + 7 * math.sin(self.tick / 3 + index) + (index % 3) * 2))
            records.append({
                "number": number, "name": name, "category": category, "origin": origin, "destination": destination,
                "section": f"S{position // 40 + 1}", "position_km": position,
                "speed_kmph": 0 if position % 40 < 4 else 82 - index * 3, "delay_minutes": delay,
                "delay_prediction_minutes": max(0, delay + ((self.tick + index) % 5) - 2),
                "traction_status": "Healthy" if (self.tick + index) % 11 else "Attention",
                "status": "Running" if position % 40 >= 4 else "At station",
            })
        return records

    def _signals(self) -> list[dict[str, Any]]:
        return [{
            "id": f"S{index + 1}", "location": ["NDG North Cabin", "NDG East Yard", "KRP Home", "STP Outer"][index % 4],
            "status": "Red" if (index + self.tick) % 17 == 0 else "Yellow" if (index + self.tick) % 9 == 0 else "Green",
            "aspect_age_seconds": 2 + ((self.tick + index) % 8),
            "alert": "Lamp or relay attention" if (index + self.tick) % 17 == 0 else "No alerts",
        } for index in range(12)]

    def _tracks(self) -> list[dict[str, Any]]:
        names = ["UP-MAIN", "DN-MAIN", "LOOP-1", "LOOP-2", "YARD-1", "YARD-2", "S3-MAIN", "S4-MAIN"]
        records = []
        for index, name in enumerate(names):
            health = max(78, min(100, 97 - ((self.tick + index * 3) % 12)))
            records.append({
                "id": name, "section": f"S{index % 4 + 1}",
                "occupancy": "Blocked" if index == (self.tick % len(names)) and self.tick % 4 == 0 else "Occupied" if (index + self.tick) % 3 == 0 else "Free",
                "trains": (index + self.tick) % 4, "health": health,
                "condition": "Critical" if health < 85 else "Warning" if health < 93 else "Healthy",
            })
        return records

    def _maintenance(self) -> list[dict[str, Any]]:
        blocks = [
            ("BLK-101", "S1", "NDG-KRP", "Track tamping", "Engineering"),
            ("BLK-204", "S2", "KRP-STP", "OHE inspection", "TRD"),
            ("BLK-309", "S3", "STP-DVR", "Signal relay testing", "S&T"),
            ("BLK-412", "S4", "DVR-MRG", "Bridge inspection", "Engineering"),
        ]
        count = 2 + self.tick % 3
        return [{
            "id": block[0], "section": block[1], "location": block[2], "activity": block[3], "department": block[4],
            "status": "Active", "progress": (self.tick * 9 + index * 17) % 100,
            "window_minutes_remaining": 35 + ((self.tick + index) * 7) % 90,
        } for index, block in enumerate(blocks[:count])]


simulation = RailwaySimulation()


def get_snapshot() -> dict[str, Any]:
    return simulation.snapshot()


async def stream_snapshots(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(get_snapshot())
            await asyncio.sleep(5)
    except Exception:
        await websocket.close()