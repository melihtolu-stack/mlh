"""
Media Service
Handles media uploads and normalization for messages
"""
import base64
import logging
import mimetypes
import os
import uuid
from typing import List, Optional, Dict, Any

import httpx

from services.supabase_client import supabase

logger = logging.getLogger(__name__)


class MediaService:
    """
    Service for handling media attachments
    """

    def __init__(self):
        self.bucket = os.getenv("SUPABASE_MEDIA_BUCKET", "message-media")

    def _sanitize_filename(self, filename: str) -> str:
        safe = "".join(c if c.isalnum() or c in ("-", "_", ".") else "_" for c in filename)
        return safe or f"file-{uuid.uuid4().hex}"

    def _guess_extension(self, content_type: Optional[str]) -> str:
        if not content_type:
            return ""
        ext = mimetypes.guess_extension(content_type)
        return ext or ""

    def _decode_base64(self, data: str) -> bytes:
        if "," in data:
            data = data.split(",", 1)[1]
        return base64.b64decode(data)

    def _upload_bytes(self, data: bytes, content_type: Optional[str], filename: str, conversation_id: str) -> Optional[Dict[str, Any]]:
        safe_name = self._sanitize_filename(filename)
        path = f"conversations/{conversation_id}/{uuid.uuid4().hex}-{safe_name}"
        try:
            response = supabase.storage.from_(self.bucket).upload(
                path,
                data,
                {"content-type": content_type or "application/octet-stream"}
            )
            if not response:
                logger.error("Supabase upload failed without response")
                return None
            public = supabase.storage.from_(self.bucket).get_public_url(path)
            public_url = public.get("publicURL") or public.get("publicUrl") or public.get("public_url")
            if not public_url:
                logger.warning("Public URL not available for uploaded media")
            return {
                "url": public_url,
                "name": safe_name,
                "type": content_type,
                "size": len(data),
                "path": path
            }
        except Exception as e:
            logger.error(f"Error uploading media: {e}", exc_info=True)
            return None

    def _download_url(self, url: str) -> Optional[bytes]:
        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    return resp.content
                logger.error(f"Failed to download media from {url}: HTTP {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error downloading media from {url}: {e}")
            return None

    def process_attachments(self, attachments: Optional[List[Dict[str, Any]]], conversation_id: str) -> Optional[List[Dict[str, Any]]]:
        if not attachments:
            return None

        processed: List[Dict[str, Any]] = []
        for item in attachments:
            if not isinstance(item, dict):
                if hasattr(item, "model_dump"):
                    item = item.model_dump()
                elif hasattr(item, "dict"):
                    item = item.dict()
                else:
                    item = dict(item.__dict__)

            url = item.get("url")
            data = item.get("data")
            name = item.get("name") or item.get("filename") or f"media-{uuid.uuid4().hex}"
            content_type = item.get("type") or item.get("content_type") or "application/octet-stream"

            if url and not data:
                processed.append({
                    "url": url,
                    "name": name,
                    "type": content_type,
                    "size": item.get("size")
                })
                continue

            if data:
                try:
                    binary = self._decode_base64(data)
                    uploaded = self._upload_bytes(binary, content_type, name, conversation_id)
                    if uploaded:
                        processed.append({
                            "url": uploaded.get("url"),
                            "name": uploaded.get("name"),
                            "type": uploaded.get("type"),
                            "size": uploaded.get("size")
                        })
                    continue
                except Exception as e:
                    logger.error(f"Failed to decode base64 media: {e}")
                    continue

            if url and data:
                processed.append({
                    "url": url,
                    "name": name,
                    "type": content_type,
                    "size": item.get("size")
                })

        return processed or None


_media_service: Optional[MediaService] = None


def get_media_service() -> MediaService:
    global _media_service
    if _media_service is None:
        _media_service = MediaService()
    return _media_service
