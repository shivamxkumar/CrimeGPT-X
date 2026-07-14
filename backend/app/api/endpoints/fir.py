"""
FIR Upload & OCR Endpoint
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.auth import get_current_user
from app.models.models import User
from app.services.ocr_service import ocr_service
import tempfile, os

router = APIRouter()

@router.post("/upload")
async def upload_fir(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = await ocr_service.process_file(tmp_path, file.content_type or "application/octet-stream")
    finally:
        os.unlink(tmp_path)

    return {
        "status": "success",
        "filename": file.filename,
        "ocr_result": result,
    }
