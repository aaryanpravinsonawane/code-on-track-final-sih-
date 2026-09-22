from fastapi import APIRouter

from app.ai.scheduler import recommend_schedule
from app.routes.crud import _crud_router
from app.schemas.domain import AnalyticsResponse, ScheduleInput, ScheduleRecommendation
from app.services.analytics import get_analytics

router = APIRouter()
crud = _crud_router()
router.include_router(crud)

scheduling = APIRouter(prefix="/scheduling", tags=["scheduling"])
@scheduling.post("/recommend", response_model=ScheduleRecommendation)
def schedule(request: ScheduleInput): return recommend_schedule(request)
router.include_router(scheduling)

analytics = APIRouter(prefix="/analytics", tags=["analytics"])
@analytics.get("", response_model=AnalyticsResponse)
def analytics_data(): return get_analytics()
router.include_router(analytics)
