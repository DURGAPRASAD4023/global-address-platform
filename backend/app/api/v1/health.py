"""Health and readiness endpoints."""

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, object]:
    return {
        "success": True,
        "data": {
            "status": "ok",
            "environment": settings.environment,
            "version": "0.1.0",
        },
    }


@router.get("/health/live")
async def health_live() -> dict[str, object]:
    return {"success": True, "data": {"status": "alive"}}


@router.get("/health/ready")
async def health_ready() -> dict[str, object]:
    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False

    status = "ready" if db_ok else "degraded"
    return {
        "success": db_ok,
        "data": {
            "status": status,
            "checks": {
                "database": "ok" if db_ok else "unavailable",
            },
        },
    }
