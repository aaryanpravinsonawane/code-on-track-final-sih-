from ortools.sat.python import cp_model


def optimize_schedule(trains: list[dict], platforms: list[str], tracks: list[str], safety_distance_minutes: int = 5) -> dict:
    model = cp_model.CpModel()
    if not trains or not platforms or not tracks:
        return {"assignments": [], "conflicts": ["Trains, platforms and tracks are required"], "optimization_score": 0}
    max_time = max(int(train["departure_time"]) for train in trains) + 120
    starts = {}
    platform_vars = {}
    track_vars = {}
    for index, train in enumerate(trains):
        arrival = int(train["arrival_time"])
        departure = int(train["departure_time"])
        starts[index] = model.new_int_var(arrival, max(arrival, max_time - max(1, departure - arrival)), f"start_{index}")
        platform_vars[index] = [model.new_bool_var(f"p_{index}_{p}") for p in range(len(platforms))]
        track_vars[index] = [model.new_bool_var(f"t_{index}_{t}") for t in range(len(tracks))]
        model.add_exactly_one(platform_vars[index])
        model.add_exactly_one(track_vars[index])
    for resource_vars, resource_count, prefix in [(platform_vars, len(platforms), "platform"), (track_vars, len(tracks), "track")]:
        for resource_index in range(resource_count):
            for first in range(len(trains)):
                for second in range(first + 1, len(trains)):
                    # If both trains choose the same resource, require ordered start times.
                    order = model.new_bool_var(f"{prefix}_order_{first}_{second}_{resource_index}")
                    model.add(starts[first] + max(1, int(trains[first]["departure_time"]) - int(trains[first]["arrival_time"])) + safety_distance_minutes <= starts[second]).only_enforce_if([resource_vars[first][resource_index], resource_vars[second][resource_index], order])
                    model.add(starts[second] + max(1, int(trains[second]["departure_time"]) - int(trains[second]["arrival_time"])) + safety_distance_minutes <= starts[first]).only_enforce_if([resource_vars[first][resource_index], resource_vars[second][resource_index], order.Not()])
    model.minimize(sum(starts[index] - int(train["arrival_time"]) for index, train in enumerate(trains)))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 3.0
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"assignments": [], "conflicts": ["No feasible schedule found"], "optimization_score": 0}
    assignments = []
    total_delay = 0
    for index, train in enumerate(trains):
        arrival = solver.value(starts[index])
        total_delay += arrival - int(train["arrival_time"])
        assignments.append({"train_id": train["train_id"], "arrival_time": arrival, "departure_time": arrival + int(train["departure_time"]) - int(train["arrival_time"]), "assigned_platform": platforms[next(p for p in range(len(platforms)) if solver.value(platform_vars[index][p]))], "assigned_track": tracks[next(t for t in range(len(tracks)) if solver.value(track_vars[index][t]))], "delay_minutes": arrival - int(train["arrival_time"])})
    score = max(0, round(100 - total_delay / max(1, len(trains)) * 2, 1))
    return {"assignments": assignments, "conflicts": [], "optimization_score": score}
