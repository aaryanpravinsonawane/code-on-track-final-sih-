from app.services.repositories import issue_repository, signal_repository, train_repository


def get_analytics() -> dict[str, list[dict[str, int | str]]]:
    trains = train_repository.list()
    issues = issue_repository.list()
    signals = signal_repository.list()
    departments = sorted({str(issue["department"]) for issue in issues}) or ["Engineering", "S&T", "TRD"]
    return {
        "train_traffic": [{"section": section, "count": sum(1 for train in trains if train["section"] == section)} for section in ["S1", "S2", "S3", "S4"]],
        "issue_trends": [{"status": status, "count": sum(1 for issue in issues if issue["status"] == status)} for status in ["Open", "Investigating", "Resolved"]],
        "department_performance": [{"department": department, "open": sum(1 for issue in issues if issue["department"] == department and issue["status"] != "Resolved")} for department in departments],
        "resolution_rates": [{"status": "Resolved", "count": sum(1 for issue in issues if issue["status"] == "Resolved")}, {"status": "Pending", "count": sum(1 for issue in issues if issue["status"] != "Resolved")}],
        "signal_health": [{"health": health, "count": sum(1 for signal in signals if signal["health"] == health)} for health in ["Healthy", "Degraded", "Fault"]],
        "power_analytics": [{"period": period, "consumption": consumption} for period, consumption in [("00:00", 42), ("06:00", 58), ("12:00", 71), ("18:00", 64)]],
        "delay_prediction_trends": [{"period": period, "risk": risk} for period, risk in [("06:00", 34), ("12:00", 48), ("18:00", 62), ("22:00", 39)]],
        "platform_utilization": [{"platform": platform, "utilization": utilization} for platform, utilization in [("P1", 82), ("P2", 69), ("P3", 91), ("P4", 54)]],
        "track_utilization": [{"track": track, "utilization": utilization} for track, utilization in [("T1", 76), ("T2", 64), ("T3", 88), ("T4", 51)]],
        "conflict_statistics": [{"type": conflict_type, "count": count} for conflict_type, count in [("Platform", 2), ("Track", 1), ("Route", 1), ("Timing", 3)]],
        "optimization_performance": [{"metric": metric, "value": value} for metric, value in [("Conflict reduction", 74), ("Utilization gain", 18), ("Delay reduction", 29)]],
    }
