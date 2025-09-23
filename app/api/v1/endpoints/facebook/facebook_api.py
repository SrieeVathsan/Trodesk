from app.core.config import GRAPH,FB_PAGE_ID,PAGE_ACCESS_TOKEN
from fastapi import Depends, HTTPException,APIRouter
from httpx import AsyncClient
from app.services.facebook_service import get_fb_mentions,get_fb_posts,reply_to_post,reply_in_private
from app.core.logger import app_logger
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router=APIRouter(tags=["Facebook"])


@router.post("/facebook/posts/text")
async def create_facebook_text_post(
    message: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a Facebook Page post with only text.
    """
    try:
        return await create_fb_text_post(db, message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/facebook/posts/photos")
async def create_facebook_photo_post(
    message: str,
    photo_urls: Optional[List[str]] = None,
    image_files: Optional[List[UploadFile]] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a Facebook Page post with one or more photos (via URLs or file upload).
    """
    try:
        image_bytes = []
        image_filenames = []
        if image_files:
            for upload in image_files:
                contents = await upload.read()
                image_bytes.append(contents)
                image_filenames.append(upload.filename or "unknown")

        return await create_fb_photo_post(
            db=db,
            message=message,
            photo_urls=photo_urls or [],
            image_files=image_bytes,
            image_filenames=image_filenames
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))