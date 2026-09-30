from app.ai.block_allocator import allocate_blocks
from app.ai.delay_predictor import predict_delay
from app.ai.platform_allocator import allocate_platforms
from app.ai.schedule_optimizer import optimize_schedule
from app.ai.track_allocator import allocate_tracks
from app.ai.maintenance_block_optimizer import optimize_maintenance_blocks


TRAINS = [
    {"train_id": "TR101", "arrival_time": 60, "departure_time": 90, "priority": 1, "section": "S1"},
    {"train_id": "TR102", "arrival_time": 120, "departure_time": 150, "priority": 2, "section": "S1"},
    {"train_id": "TR103", "arrival_time": 180, "departure_time": 210, "priority": 3, "section": "S2"},
]


def test_platform_assignments_are_valid():
    result = allocate_platforms(TRAINS, ["P1", "P2"])
    assert len(result) == len(TRAINS)
    assert all(item["assigned_platform"] in {"P1", "P2"} for item in result)
    assert all(item["conflict"] is False for item in result)


def test_track_and_block_assignments_are_valid():
    tracks = allocate_tracks(TRAINS, ["T1", "T2"])
    blocks = allocate_blocks(TRAINS, ["B1", "B2", "B3"])
    assert len(tracks) == len(TRAINS)
    assert len(blocks["allocations"]) == len(TRAINS)
    assert not blocks["conflicts"]


def test_schedule_and_prediction_return_operational_metrics():
    schedule = optimize_schedule(TRAINS, ["P1", "P2"], ["T1", "T2"])
    prediction = predict_delay({"traffic_volume": 8, "platform_usage": 80, "incident_count": 2, "train_priority": 1, "historical_delay": 10})
    assert len(schedule["assignments"]) == len(TRAINS)
    assert 0 <= prediction["delay_probability"] <= 100
    assert prediction["risk_level"] in {"Low", "Medium", "High"}


def test_maintenance_optimizer_protects_train_paths_and_reports_solver_status():
    result = optimize_maintenance_blocks(
        {
            "requests": [
                {
                    "id": "BLK-1",
                    "section": "S1",
                    "track": "UP-MAIN",
                    "window_start": 600,
                    "window_end": 780,
                    "duration_minutes": 60,
                    "department": "Engineering",
                    "resources": ["Tamping Machine"],
                    "priority": 5,
                    "urgency": 9,
                    "bundle_key": "S1-UP-MAIN",
                },
                {
                    "id": "BLK-2",
                    "section": "S1",
                    "track": "UP-MAIN",
                    "window_start": 600,
                    "window_end": 780,
                    "duration_minutes": 60,
                    "department": "S&T",
                    "resources": ["Signal Crew 1"],
                    "priority": 4,
                    "urgency": 8,
                    "bundle_key": "S1-UP-MAIN",
                },
            ],
            "trains": [
                {
                    "id": "EXP-1",
                    "section": "S1",
                    "start": 620,
                    "end": 680,
                    "priority": 1,
                }
            ],
            "safety_buffer_minutes": 10,
            "slot_minutes": 15,
            "time_limit_seconds": 2,
        }
    )

    assert result["solver_mode"] == "ortools-cp-sat"
    assert result["solver_status"] in {"OPTIMAL", "FEASIBLE"}
    assert len(result["schedule"]) == 2
    assert all(item["start"] >= 690 for item in result["schedule"])
    assert len({item["bundle_id"] for item in result["schedule"]}) == 1
    assert result["metrics"]["train_conflicts_avoided"] >= 1
