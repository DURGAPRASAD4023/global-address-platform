"""Security helpers — API key architecture (authorization-ready)."""

from fastapi import Header, HTTPException, status

from app.core.config import settings


async def optional_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> str | None:
    """Extract optional API key. Full auth enforcement lands in Phase 9."""
    _ = settings.api_key_header
    return x_api_key


async def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> str:
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "API_KEY_REQUIRED",
                    "message": "A valid API key is required.",
                    "details": {},
                },
            },
        )
    return x_api_key
