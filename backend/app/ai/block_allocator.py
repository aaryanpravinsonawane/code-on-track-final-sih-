from ortools.sat.python import cp_model


def allocate_blocks(trains: list[dict], blocks: list[str], safety_distance_minutes: int = 5) -> dict:
    if not trains or not blocks:
        return {"allocations": [], "conflicts": ["Trains and blocks are required"]}
    model = cp_model.CpModel()
    assignment = [[model.new_bool_var(f"b_{i}_{j}") for j in range(len(blocks))] for i in range(len(trains))]
    model.add(sum(var for row in assignment for var in row) == len(trains))
    for row in assignment:
        model.add_exactly_one(row)
    for block_index in range(len(blocks)):
        for first in range(len(trains)):
            for second in range(first + 1, len(trains)):
                model.add(assignment[first][block_index] + assignment[second][block_index] <= 1)
    model.maximize(sum(max(1, 10 - int(train.get("priority", 5))) * assignment[i][j] for i, train in enumerate(trains) for j in range(len(blocks))))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"allocations": [], "conflicts": ["No safe block allocation found"]}
    return {"allocations": [{"train_id": train["train_id"], "block": blocks[next(j for j in range(len(blocks)) if solver.value(assignment[i][j]))], "safety_distance_minutes": safety_distance_minutes} for i, train in enumerate(trains)], "conflicts": []}
