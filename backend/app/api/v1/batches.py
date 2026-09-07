"""Small synchronous batch API with a stable shape for future workers."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.exceptions import AppError
from app.services.validation_service import ValidationService

router = APIRouter()


class BatchValidateRequest(BaseModel):
    country: str = Field(..., min_length=2, max_length=2)
    addresses: list[str] = Field(..., min_length=1, max_length=100)


@router.post("/batches/validate")
async def create_validation_batch(body: BatchValidateRequest) -> dict[str, object]:
    service = ValidationService()
    results = []
    for index, address in enumerate(body.addresses):
        try:
            result = await service.validate(body.country.upper(), address)
            results.append({"index": index, "status": "completed", "result": result})
        except AppError as exc:
            results.append(
                {
                    "index": index,
                    "status": "failed",
                    "error": {"code": exc.code, "message": exc.message},
                }
            )
    completed = sum(item["status"] == "completed" for item in results)
    return {
        "success": True,
        "data": {
            "batch_id": f"local-{id(results)}",
            "status": "completed",
            "total": len(results),
            "completed": completed,
            "failed": len(results) - completed,
            "results": results,
        },
    }


@router.get("/batches/{batch_id}")
async def get_batch(batch_id: str) -> dict[str, object]:
    return {"success": True, "data": {"batch_id": batch_id, "status": "completed"}}


@router.get("/batches/{batch_id}/addresses")
async def get_batch_addresses(batch_id: str) -> dict[str, object]:
    return {"success": True, "data": {"batch_id": batch_id, "results": []}}
