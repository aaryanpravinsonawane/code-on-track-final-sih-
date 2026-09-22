from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config.settings import get_settings

_engine = None
_session_factory = None


def get_session_factory():
    global _engine, _session_factory
    settings = get_settings()
    if not settings.database_url:
        return None
    if _session_factory is None:
        _engine = create_engine(settings.database_url, pool_pre_ping=True)
        _session_factory = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    factory = get_session_factory()
    if factory is None:
        yield None
        return
    session = factory()
    try:
        yield session
    finally:
        session.close()
