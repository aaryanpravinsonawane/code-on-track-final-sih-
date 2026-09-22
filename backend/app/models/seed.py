from datetime import UTC, datetime

TRAINS = [
    {"id": "12951", "name": "Rajdhani Link", "type": "Superfast", "section": "S1", "arrival": 360, "departure": 392, "priority": 1, "status": "Scheduled"},
    {"id": "12615", "name": "Grand Trunk Exp", "type": "Express", "section": "S1", "arrival": 425, "departure": 459, "priority": 2, "status": "Scheduled"},
    {"id": "12841", "name": "Coromandel Link", "type": "Superfast", "section": "S2", "arrival": 380, "departure": 415, "priority": 1, "status": "Scheduled"},
]
TRACKS = [
    {"id": "S1", "name": "S1 · NDG-KRP", "status": "Operational", "maintenance_status": "Overdue"},
    {"id": "S2", "name": "S2 · KRP-STP", "status": "Operational", "maintenance_status": "Pending"},
    {"id": "S3", "name": "S3 · STP-DVR", "status": "Restricted", "maintenance_status": "Overdue"},
    {"id": "S4", "name": "S4 · DVR-MRG", "status": "Operational", "maintenance_status": "Pending"},
]
SIGNALS = [
    {"id": "SIG-S1-01", "name": "S1 Home", "section": "S1", "health": "Healthy", "aspect": "Green", "last_updated": datetime.now(UTC)},
    {"id": "SIG-S2-01", "name": "S2 Home", "section": "S2", "health": "Degraded", "aspect": "Yellow", "last_updated": datetime.now(UTC)},
]
STATIONS = [
    {"id": "A", "code": "NDG", "name": "Nandgaon Jn", "platforms": 4, "platform_status": {"1": "Occupied", "2": "Available", "3": "Available", "4": "Maintenance"}},
    {"id": "B", "code": "KRP", "name": "Karimpur", "platforms": 3, "platform_status": {"1": "Available", "2": "Occupied", "3": "Available"}},
]
ISSUES = [
    {"id": "ISS-1001", "title": "Track circuit intermittency", "description": "Intermittent occupancy indication on S2.", "severity": "High", "department": "S&T", "asset": "TC-S2-14", "status": "Investigating", "created_at": datetime.now(UTC), "resolved_at": None},
]
