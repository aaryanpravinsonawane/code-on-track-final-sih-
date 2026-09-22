from app.database.repositories import InMemoryRepository
from app.models.seed import ISSUES, SIGNALS, STATIONS, TRACKS, TRAINS

train_repository = InMemoryRepository(TRAINS)
track_repository = InMemoryRepository(TRACKS)
signal_repository = InMemoryRepository(SIGNALS)
station_repository = InMemoryRepository(STATIONS)
issue_repository = InMemoryRepository(ISSUES)
