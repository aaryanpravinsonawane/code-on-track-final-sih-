from io import BytesIO

import pandas as pd

from app.services.data_processor import frame_records, store
from app.services.smms_analytics import get_smms_analytics
from app.services.tdms_analytics import get_tdms_analytics
from app.services.tms_analytics import get_tms_analytics


def build_excel_report() -> BytesIO:
    output = BytesIO()
    tms = get_tms_analytics()
    smms = get_smms_analytics()
    tdms = get_tdms_analytics()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(frame_records(store.get("tracks"))).to_excel(writer, sheet_name="TMS Report", index=False)
        pd.DataFrame(frame_records(store.get("signals"))).to_excel(writer, sheet_name="SMMS Report", index=False)
        pd.DataFrame(frame_records(store.get("power"))).to_excel(writer, sheet_name="TDMS Report", index=False)
        pd.DataFrame([tms["kpis"], smms["kpis"], tdms["kpis"]], index=["TMS", "SMMS", "TDMS"]).to_excel(writer, sheet_name="Analytics Summary")
    output.seek(0)
    return output
