from datetime import datetime, timedelta, timezone

import pandas as pd

from app.services.data_processor import frame_records, store
from app.services.smms_analytics import get_smms_analytics
from app.services.tdms_analytics import get_tdms_analytics
from app.services.tms_analytics import get_tms_analytics


def generate_report(period: str = "daily") -> dict:
    now = datetime.now(timezone.utc)
    days = {"daily": 1, "weekly": 7, "monthly": 30}.get(period, 1)
    cutoff = now - timedelta(days=days)
    issues = store.get("issues")
    if "created_at" in issues:
        created_at = pd.to_datetime(issues["created_at"], utc=True, errors="coerce")
        issues = issues[created_at >= pd.Timestamp(cutoff)]
    return {"period": period, "generated_at": now.isoformat(), "tms": get_tms_analytics(), "smms": get_smms_analytics(), "tdms": get_tdms_analytics(), "department_report": frame_records(issues.groupby("department", observed=True).agg(total=("issue_id", "count"), open=("status", lambda values: (values != "Resolved").sum())).reset_index()) if not issues.empty else []}
