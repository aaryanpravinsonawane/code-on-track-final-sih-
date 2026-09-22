from ortools.sat.python import cp_model


def allocate_platforms(trains: list[dict], platforms: list[str]) -> list[dict]:
    if not trains or not platforms:
        return [{"train_id": train["train_id"], "assigned_platform": None, "conflict": True, "utilization_score": 0} for train in trains]
    model = cp_model.CpModel()
    horizon = max(int(train["departure_time"]) for train in trains) + 1
    assignment: dict[tuple[int, int], cp_model.IntVar] = {}
    intervals: dict[tuple[int, int], cp_model.IntervalVar] = {}
    for index, train in enumerate(trains):
        start = int(train["arrival_time"])
        end = max(start + 1, int(train["departure_time"]))
        choices = []
        for platform_index, _ in enumerate(platforms):
            assigned = model.new_bool_var(f"platform_{index}_{platform_index}")
            interval = model.new_optional_interval_var(start, end - start, end, assigned, f"interval_{index}_{platform_index}")
            assignment[index, platform_index] = assigned
            intervals[index, platform_index] = interval
            choices.append(assigned)
        model.add_exactly_one(choices)
    for platform_index, _ in enumerate(platforms):
        model.add_no_overlap([intervals[index, platform_index] for index in range(len(trains))])
    # Priority is a soft objective: lower priority number receives larger weight.
    objective = []
    for index, train in enumerate(trains):
        weight = max(1, 10 - int(train.get("priority", 5)))
        objective.extend(weight * assignment[index, platform_index] for platform_index in range(len(platforms)))
    model.maximize(sum(objective))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return [{"train_id": train["train_id"], "assigned_platform": None, "conflict": True, "utilization_score": 0} for train in trains]
    results = []
    for index, train in enumerate(trains):
        selected = next((platforms[p] for p in range(len(platforms)) if solver.value(assignment[index, p])), None)
        duration = max(1, int(train["departure_time"]) - int(train["arrival_time"]))
        utilization = min(100, round(duration / max(1, horizon) * 100 * len(trains) / len(platforms)))
        results.append({"train_id": train["train_id"], "assigned_platform": selected, "conflict": selected is None, "utilization_score": utilization})
    return results
