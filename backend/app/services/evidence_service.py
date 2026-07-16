"""
Evidence Management Service
Handles upload to MinIO, SHA-256 hashing, and chain of custody tracking
"""
import hashlib
import logging
import uuid
from datetime import datetime
from typing import IO, Tuple, Optional, Dict, Any
from io import BytesIO
import mimetypes

from app.core.config import settings

logger = logging.getLogger(__name__)


class EvidenceStorageError(Exception):
    """Raised when evidence cannot be durably stored — chain of custody must never degrade
    to ephemeral local storage silently."""


class EvidenceService:
    """Secure evidence storage and chain-of-custody management"""

    def __init__(self):
        self._minio = None

    def _get_minio(self):
        if not self._minio:
            try:
                from minio import Minio
                self._minio = Minio(
                    settings.MINIO_ENDPOINT,
                    access_key=settings.MINIO_ACCESS_KEY,
                    secret_key=settings.MINIO_SECRET_KEY,
                    secure=False,
                )
                # Ensure buckets exist
                for bucket in [
                    settings.MINIO_BUCKET_EVIDENCE,
                    settings.MINIO_BUCKET_DOCUMENTS,
                    settings.MINIO_BUCKET_FIR,
                ]:
                    if not self._minio.bucket_exists(bucket):
                        self._minio.make_bucket(bucket)
            except Exception as e:
                logger.warning(f"MinIO not available: {e}")
        return self._minio

    async def upload_evidence(
        self,
        case_id: str,
        file_data: bytes,
        original_filename: str,
        mime_type: str,
        officer_id: str,
        officer_name: str,
    ) -> Dict[str, Any]:
        """Upload evidence file and return storage metadata"""

        # Generate hashes
        sha256 = hashlib.sha256(file_data).hexdigest()
        md5 = hashlib.md5(file_data).hexdigest()

        # Generate unique filename
        ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "bin"
        stored_name = f"{case_id}/{uuid.uuid4().hex[:12]}.{ext}"

        # Upload to MinIO
        file_path = await self._upload_to_storage(
            settings.MINIO_BUCKET_EVIDENCE,
            stored_name,
            file_data,
            mime_type,
        )

        # Initial custody chain entry
        custody_entry = {
            "officer_id": officer_id,
            "officer_name": officer_name,
            "action": "UPLOAD",
            "timestamp": datetime.utcnow().isoformat(),
            "notes": f"Evidence uploaded by {officer_name}",
            "hash_verified": True,
        }

        return {
            "file_name": stored_name,
            "original_name": original_filename,
            "file_path": file_path,
            "file_size": len(file_data),
            "mime_type": mime_type,
            "sha256_hash": sha256,
            "md5_hash": md5,
            "custody_chain": [custody_entry],
        }

    async def _upload_to_storage(
        self,
        bucket: str,
        object_name: str,
        data: bytes,
        content_type: str,
    ) -> str:
        minio = self._get_minio()
        if not minio:
            raise EvidenceStorageError("Evidence object storage (MinIO/S3) is not configured or unreachable")

        try:
            minio.put_object(
                bucket, object_name, BytesIO(data), len(data),
                content_type=content_type
            )
            return f"{bucket}/{object_name}"
        except Exception as e:
            logger.error(f"MinIO upload failed: {e}")
            raise EvidenceStorageError(f"Evidence upload failed: {e}") from e

    def download_object(self, file_path: str) -> bytes:
        """Fetch the real evidence bytes from storage. MinIO runs on a private
        network with no public endpoint, so the backend proxies the download
        rather than issuing a presigned URL the client couldn't reach."""
        minio = self._get_minio()
        if not minio:
            raise EvidenceStorageError("Evidence object storage (MinIO/S3) is not configured or unreachable")
        bucket, obj = file_path.split("/", 1)
        try:
            response = minio.get_object(bucket, obj)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()
        except Exception as e:
            logger.error(f"MinIO download failed: {e}")
            raise EvidenceStorageError(f"Evidence download failed: {e}") from e

    def delete_object(self, file_path: str) -> None:
        """Permanently remove an evidence object from storage."""
        minio = self._get_minio()
        if not minio:
            raise EvidenceStorageError("Evidence object storage (MinIO/S3) is not configured or unreachable")
        bucket, obj = file_path.split("/", 1)
        try:
            minio.remove_object(bucket, obj)
        except Exception as e:
            logger.error(f"MinIO delete failed: {e}")
            raise EvidenceStorageError(f"Evidence deletion failed: {e}") from e

    def verify_integrity(self, file_data: bytes, expected_sha256: str) -> bool:
        """Verify file integrity against stored hash"""
        actual = hashlib.sha256(file_data).hexdigest()
        return actual == expected_sha256

    def add_custody_entry(
        self,
        existing_chain: list,
        officer_id: str,
        officer_name: str,
        action: str,
        notes: str = "",
    ) -> list:
        """Add new chain of custody entry"""
        entry = {
            "officer_id": officer_id,
            "officer_name": officer_name,
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "notes": notes,
        }
        return existing_chain + [entry]

    def detect_manipulation(self, file_path: str, mime_type: str) -> Dict[str, Any]:
        """Basic manipulation detection for images"""
        result = {
            "is_potentially_manipulated": False,
            "confidence": 0.0,
            "indicators": [],
        }
        if "image" not in mime_type:
            return result

        try:
            from PIL import Image
            import struct

            with Image.open(file_path) as img:
                # Check EXIF data
                exif = img._getexif() if hasattr(img, '_getexif') else None
                if exif:
                    # Missing date/time is suspicious for screenshots
                    if 306 not in exif:  # DateTime tag
                        result["indicators"].append("Missing EXIF timestamp")
                    # Software tag may indicate editing
                    if 305 in exif:
                        software = str(exif[305])
                        suspicious = ["photoshop", "gimp", "snagit", "lightroom"]
                        if any(s in software.lower() for s in suspicious):
                            result["indicators"].append(f"Editing software detected: {software}")
                            result["is_potentially_manipulated"] = True
                            result["confidence"] = 0.75

        except Exception as e:
            logger.debug(f"Manipulation detection skipped: {e}")

        return result


evidence_service = EvidenceService()
