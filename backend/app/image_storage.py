"""One responsibility: validate and compress uploaded images for the local storage adapter."""
from pathlib import Path
from uuid import uuid4
import io
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from .config import get_settings

UPLOAD_PATH = Path(__file__).resolve().parents[1] / 'uploads'
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 12_000_000


async def save_webp(file: UploadFile) -> str:
    """Local development storage; production should use a persistent volume / object storage."""
    if file.content_type not in ('image/jpeg', 'image/png', 'image/webp'):
        raise HTTPException(415, 'รองรับเฉพาะ JPEG / PNG / WEBP')
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(413, 'ขนาดรูปภาพเกิน 5 MB')
    try:
        Image.MAX_IMAGE_PIXELS = MAX_PIXELS
        with Image.open(io.BytesIO(content)) as img:
            if img.width * img.height > MAX_PIXELS:
                raise HTTPException(413, 'รูปภาพมีความละเอียดสูงเกินไป')
            img.load()
            img.thumbnail((1600, 1600))
            processed = img.convert('RGB')
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise HTTPException(415, 'ไฟล์รูปภาพไม่ถูกต้อง') from exc
    name = f'{uuid4().hex}.webp'
    processed.save(UPLOAD_PATH / name, format='WEBP', quality=78, method=4)
    return f'{get_settings().api_public_url.rstrip("/")}/uploads/{name}'
