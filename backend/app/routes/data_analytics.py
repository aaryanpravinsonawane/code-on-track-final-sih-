from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.services.csv_importer import import_csv
from app.services.excel_exporter import build_excel_report
from app.services.report_generator import generate_report
from app.services.smms_analytics import get_smms_analytics
from app.services.tdms_analytics import get_tdms_analytics
from app.services.tms_analytics import get_tms_analytics

router = APIRouter(tags=["pandas-analytics"])


@router.get("/analytics/tms")
def tms_analytics():
    return get_tms_analytics()


@router.get("/analytics/smms")
def smms_analytics():
    return get_smms_analytics()


@router.get("/analytics/tdms")
def tdms_analytics():
    return get_tdms_analytics()


@router.get("/analytics/summary")
def analytics_summary(period: str = "daily"):
    if period not in {"daily", "weekly", "monthly"}:
        raise HTTPException(status_code=422, detail="period must be daily, weekly, or monthly")
    return generate_report(period)


@router.post("/import/csv")
async def import_csv_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        return import_csv(file.filename or "", content)
    except (ValueError, UnicodeDecodeError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.get("/export/excel")
def export_excel():
    return StreamingResponse(build_excel_report(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=railway-analytics.xlsx"})
