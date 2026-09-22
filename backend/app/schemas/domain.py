from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Train(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    type: str
    section: str
    arrival: int = Field(ge=0, le=1440)
    departure: int = Field(ge=0, le=1440)
    priority: int = Field(ge=1, le=5)
    status: str = "Scheduled"


class TrainCreate(Train):
    pass


class TrainUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    section: str | None = None
    arrival: int | None = Field(default=None, ge=0, le=1440)
    departure: int | None = Field(default=None, ge=0, le=1440)
    priority: int | None = Field(default=None, ge=1, le=5)
    status: str | None = None


class Track(BaseModel):
    id: str
    name: str
    status: Literal["Operational", "Restricted", "Blocked", "Maintenance"] = "Operational"
    maintenance_status: str = "Pending"
    allocated_to: str | None = None


class TrackUpdate(BaseModel):
    status: Literal["Operational", "Restricted", "Blocked", "Maintenance"] | None = None
    maintenance_status: str | None = None
    allocated_to: str | None = None


class Signal(BaseModel):
    id: str
    name: str
    section: str
    health: Literal["Healthy", "Degraded", "Fault"] = "Healthy"
    aspect: str = "Green"
    last_updated: datetime | None = None


class SignalUpdate(BaseModel):
    health: Literal["Healthy", "Degraded", "Fault"] | None = None
    aspect: str | None = None


class Station(BaseModel):
    id: str
    code: str
    name: str
    platforms: int = Field(ge=1)
    platform_status: dict[str, str] = Field(default_factory=dict)


class Issue(BaseModel):
    id: str
    title: str
    description: str
    severity: Literal["Low", "Medium", "High", "Critical"] = "Medium"
    department: str
    asset: str
    status: Literal["Open", "Investigating", "Resolved"] = "Open"
    created_at: datetime
    resolved_at: datetime | None = None


class IssueCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=3, max_length=4000)
    severity: Literal["Low", "Medium", "High", "Critical"] = "Medium"
    department: str = Field(min_length=2, max_length=80)
    asset: str = Field(min_length=2, max_length=120)


class IssueUpdate(BaseModel):
    status: Literal["Open", "Investigating", "Resolved"] | None = None
    severity: Literal["Low", "Medium", "High", "Critical"] | None = None
    description: str | None = Field(default=None, min_length=3, max_length=4000)


class ScheduleInput(BaseModel):
    train_priority: int = Field(ge=1, le=5)
    arrival_time: int = Field(ge=0, le=1440)
    departure_time: int = Field(ge=0, le=1440)
    platform_availability: list[str] = Field(default_factory=list)
    track_availability: list[str] = Field(default_factory=list)
    section: str = Field(min_length=1, max_length=20)
    duration_minutes: int = Field(default=60, ge=1, le=1440)


class ScheduleRecommendation(BaseModel):
    recommended_platform: str | None
    recommended_track: str | None
    conflict_warnings: list[str]
    delay_risk_score: float = Field(ge=0, le=1)
    explanation: list[str]


class AnalyticsResponse(BaseModel):
    train_traffic: list[dict[str, int | str]]
    issue_trends: list[dict[str, int | str]]
    department_performance: list[dict[str, int | str]]
    resolution_rates: list[dict[str, int | str]]
    signal_health: list[dict[str, int | str]]
    power_analytics: list[dict[str, int | str]]
    delay_prediction_trends: list[dict[str, int | str]] = Field(default_factory=list)
    platform_utilization: list[dict[str, int | str]] = Field(default_factory=list)
    track_utilization: list[dict[str, int | str]] = Field(default_factory=list)
    conflict_statistics: list[dict[str, int | str]] = Field(default_factory=list)
    optimization_performance: list[dict[str, int | str]] = Field(default_factory=list)


class OptimizationTrain(BaseModel):
    train_id: str = Field(min_length=1, max_length=40)
    arrival_time: int = Field(ge=0, le=2880)
    departure_time: int = Field(ge=1, le=2880)
    priority: int = Field(default=5, ge=1, le=5)
    section: str = Field(default="", max_length=40)
    route: str | None = Field(default=None, max_length=120)
    assigned_platform: str | None = None
    assigned_track: str | None = None


class PlatformOptimizationRequest(BaseModel):
    trains: list[OptimizationTrain] = Field(min_length=1, max_length=2000)
    platforms: list[str] = Field(min_length=1, max_length=100)


class TrackOptimizationRequest(BaseModel):
    trains: list[OptimizationTrain] = Field(min_length=1, max_length=2000)
    tracks: list[str] = Field(min_length=1, max_length=100)
    safety_distance_minutes: int = Field(default=5, ge=0, le=120)


class BlockOptimizationRequest(BaseModel):
    trains: list[OptimizationTrain] = Field(min_length=1, max_length=2000)
    blocks: list[str] = Field(min_length=1, max_length=2000)
    safety_distance_minutes: int = Field(default=5, ge=0, le=120)


class ConflictRequest(BaseModel):
    trains: list[OptimizationTrain] = Field(min_length=2, max_length=2000)


class ScheduleOptimizationRequest(TrackOptimizationRequest):
    pass


class DelayPredictionRequest(BaseModel):
    traffic_volume: float = Field(default=0, ge=0)
    platform_usage: float = Field(default=0, ge=0, le=100)
    incident_count: float = Field(default=0, ge=0)
    train_priority: float = Field(default=5, ge=1, le=5)
    historical_delay: float = Field(default=0, ge=0)
    historical_data: list[dict[str, float]] | None = Field(default=None, max_length=5000)
