from ortools.sat.python import cp_model


def allocate_tracks(trains: list[dict], tracks: list[str], safety_distance_minutes: int = 5) -> list[dict]:
    if not trains or not tracks:
        return [{"train_id": train["train_id"], "assigned_track": None, "conflict": True} for train in trains]
    model = cp_model.CpModel()
    assignment: dict[tuple[int, int], cp_model.IntVar] = {}
    intervals: dict[tuple[int, int], cp_model.IntervalVar] = {}
    for index, train in enumerate(trains):
        start = int(train["arrival_time"])
        end = max(start + 1, int(train["departure_time"])) + safety_distance_minutes
        options = []
        for track_index, _ in enumerate(tracks):
            selected = model.new_bool_var(f"track_{index}_{track_index}")
            interval = model.new_optional_interval_var(start, end - start, end, selected, f"track_interval_{index}_{track_index}")
            assignment[index, track_index] = selected
            intervals[index, track_index] = interval
            options.append(selected)
        model.add_exactly_one(options)
    for track_index, _ in enumerate(tracks):
        model.add_no_overlap([intervals[index, track_index] for index in range(len(trains))])
    model.maximize(sum(max(1, 10 - int(train.get("priority", 5))) * assignment[index, track_index] for index, train in enumerate(trains) for track_index in range(len(tracks))))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return [{"train_id": train["train_id"], "assigned_track": None, "conflict": True} for train in trains]
    return [{"train_id": train["train_id"], "assigned_track": next((tracks[t] for t in range(len(tracks)) if solver.value(assignment[index, t])), None), "conflict": False} for index, train in enumerate(trains)]
