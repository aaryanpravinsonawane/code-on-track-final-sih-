from app.schemas.domain import ScheduleInput, ScheduleRecommendation


def recommend_schedule(request: ScheduleInput) -> ScheduleRecommendation:
    warnings: list[str] = []
    explanation: list[str] = []
    if request.departure_time <= request.arrival_time:
        warnings.append("Departure must be later than arrival")
    if not request.platform_availability:
        warnings.append("No platform availability supplied")
    if not request.track_availability:
        warnings.append("No track availability supplied")

    duration = max(request.departure_time - request.arrival_time, 1)
    delay_risk = min(1.0, (request.train_priority - 1) * 0.12 + (0.25 if warnings else 0) + (0.2 if duration < request.duration_minutes else 0))
    if request.train_priority <= 2:
        explanation.append("High-priority train receives preferential resource allocation")
    if request.platform_availability:
        explanation.append("First available platform selected")
    if request.track_availability:
        explanation.append("First available track selected")
    if not warnings:
        explanation.append("No timetable or resource conflicts detected")

    return ScheduleRecommendation(
        recommended_platform=request.platform_availability[0] if request.platform_availability else None,
        recommended_track=request.track_availability[0] if request.track_availability else None,
        conflict_warnings=warnings,
        delay_risk_score=round(delay_risk, 3),
        explanation=explanation,
    )
