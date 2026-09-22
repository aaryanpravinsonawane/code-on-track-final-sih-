from fastapi import APIRouter

from app.ai.block_allocator import allocate_blocks
from app.ai.conflict_detector import detect_conflicts
from app.ai.delay_predictor import predict_delay
from app.ai.optimizer import optimize_operations
from app.ai.platform_allocator import allocate_platforms
from app.ai.schedule_optimizer import optimize_schedule
from app.ai.track_allocator import allocate_tracks
from app.schemas.domain import BlockOptimizationRequest, ConflictRequest, DelayPredictionRequest, PlatformOptimizationRequest, ScheduleOptimizationRequest, TrackOptimizationRequest

router = APIRouter(tags=["ai-optimization"])


def _train_payload(request):
    return [train.model_dump() for train in request.trains]


@router.post("/optimizer/platform")
def platform_optimization(request: PlatformOptimizationRequest):
    trains = _train_payload(request)
    return {"assignments": allocate_platforms(trains, request.platforms)}


@router.post("/optimizer/track")
def track_optimization(request: TrackOptimizationRequest):
    return {"assignments": allocate_tracks(_train_payload(request), request.tracks, request.safety_distance_minutes)}


@router.post("/optimizer/block")
def block_optimization(request: BlockOptimizationRequest):
    return allocate_blocks(_train_payload(request), request.blocks, request.safety_distance_minutes)


@router.post("/optimizer/conflicts")
def conflict_optimization(request: ConflictRequest):
    return {"conflicts": detect_conflicts(_train_payload(request))}


@router.post("/optimizer/schedule")
def schedule_optimization(request: ScheduleOptimizationRequest):
    return optimize_schedule(_train_payload(request), ["P1", "P2", "P3", "P4"], request.tracks, request.safety_distance_minutes)


@router.post("/predict/delay")
def delay_prediction(request: DelayPredictionRequest):
    values = request.model_dump()
    historical_data = values.pop("historical_data")
    return predict_delay(values, historical_data)
