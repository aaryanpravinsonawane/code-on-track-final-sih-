from io import BytesIO

import pandas as pd

from app.services.data_processor import clean_dataframe, store

ALLOWED_DATASETS = {"tracks": "tracks", "signals": "signals", "power": "power", "issues": "issues"}


def import_csv(filename: str, content: bytes) -> dict:
    dataset = filename.rsplit(".", 1)[0].lower()
    if dataset not in ALLOWED_DATASETS or not filename.lower().endswith(".csv"):
        raise ValueError("Filename must be tracks.csv, signals.csv, power.csv, or issues.csv")
    frame = clean_dataframe(pd.read_csv(BytesIO(content)))
    if frame.empty:
        raise ValueError("CSV contains no records")
    store.replace(ALLOWED_DATASETS[dataset], frame)
    return {"dataset": dataset, "rows": len(frame), "columns": list(frame.columns), "status": "processed"}
