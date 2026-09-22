from fastapi import APIRouter, WebSocket

from app.services.simulation import get_snapshot, stream_snapshots

router = APIRouter(tags=["live simulation"])


@router.get("/trains")
def trains():
    return get_snapshot()["trains"]


@router.get("/signals")
def signals():
    return get_snapshot()["signals"]


@router.get("/tracks")
def tracks():
    return get_snapshot()["tracks"]


@router.get("/maintenance")
def maintenance():
    return get_snapshot()["maintenance"]


@router.get("/kpi")
def kpi():
    return get_snapshot()["kpi"]


@router.websocket("/ws")
async def websocket_updates(websocket: WebSocket):
    await stream_snapshots(websocket)