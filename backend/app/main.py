import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.settings import get_settings
from app.core.logging import configure_logging
from app.middleware.rate_limit import RateLimitMiddleware
from app.routes.api import router as api_router
from app.routes.auth import router as auth_router
from app.routes.data_analytics import router as data_analytics_router
from app.routes.optimizer import router as optimizer_router
from app.routes.simulation import router as simulation_router

configure_logging()
settings = get_settings()
logger = logging.getLogger(__name__)
app = FastAPI(title=settings.app_name, version="1.0.0", description="Production-ready railway operations API")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(RateLimitMiddleware)
app.include_router(api_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(optimizer_router, prefix=settings.api_prefix)
app.include_router(data_analytics_router, prefix=settings.api_prefix)
app.include_router(simulation_router, prefix=settings.api_prefix)

@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled API error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
