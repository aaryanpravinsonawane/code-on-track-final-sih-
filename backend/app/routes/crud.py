from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.domain import Issue, IssueCreate, IssueUpdate, Signal, SignalUpdate, Station, Track, TrackUpdate, Train, TrainCreate, TrainUpdate
from app.services.repositories import issue_repository, signal_repository, station_repository, track_repository, train_repository


def _crud_router():
    router = APIRouter()

    @router.get("/trains", response_model=list[Train])
    def list_trains(): return train_repository.list()
    @router.post("/trains", response_model=Train, status_code=201)
    def create_train(train: TrainCreate): return train_repository.create(train.model_dump())
    @router.patch("/trains/{train_id}", response_model=Train)
    def update_train(train_id: str, train: TrainUpdate):
        result = train_repository.update(train_id, train.model_dump(exclude_unset=True))
        if not result: raise HTTPException(404, "Train not found")
        return result
    @router.delete("/trains/{train_id}", status_code=204)
    def delete_train(train_id: str):
        if not train_repository.delete(train_id): raise HTTPException(404, "Train not found")

    @router.get("/tracks", response_model=list[Track])
    def list_tracks(): return track_repository.list()
    @router.patch("/tracks/{track_id}", response_model=Track)
    def update_track(track_id: str, track: TrackUpdate):
        result = track_repository.update(track_id, track.model_dump(exclude_unset=True))
        if not result: raise HTTPException(404, "Track not found")
        return result

    @router.get("/signals", response_model=list[Signal])
    def list_signals(): return signal_repository.list()
    @router.patch("/signals/{signal_id}", response_model=Signal)
    def update_signal(signal_id: str, signal: SignalUpdate):
        result = signal_repository.update(signal_id, {**signal.model_dump(exclude_unset=True), "last_updated": datetime.now(UTC)})
        if not result: raise HTTPException(404, "Signal not found")
        return result

    @router.get("/stations", response_model=list[Station])
    def list_stations(): return station_repository.list()

    @router.get("/issues", response_model=list[Issue])
    def list_issues(): return issue_repository.list()
    @router.post("/issues", response_model=Issue, status_code=201)
    def create_issue(issue: IssueCreate):
        item = {"id": f"ISS-{uuid4().hex[:8].upper()}", "created_at": datetime.now(UTC), "resolved_at": None, "status": "Open", **issue.model_dump()}
        return issue_repository.create(item)
    @router.patch("/issues/{issue_id}", response_model=Issue)
    def update_issue(issue_id: str, issue: IssueUpdate):
        changes = issue.model_dump(exclude_unset=True)
        if changes.get("status") == "Resolved": changes["resolved_at"] = datetime.now(UTC)
        result = issue_repository.update(issue_id, changes)
        if not result: raise HTTPException(404, "Issue not found")
        return result
    return router
