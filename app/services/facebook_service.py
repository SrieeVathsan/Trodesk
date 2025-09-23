from datetime import datetime
from app.core.config import GRAPH,FB_PAGE_ID,PAGE_ACCESS_TOKEN
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Platform, User, MentionPost
from app.services.db_services import store_mentions, get_unreplied_mentions, update_mentions_after_reply
from app.utils.llm_call import llm_call


async def create_fb_text_post(db: AsyncSession, message: str):
    """
    Create a text-only Facebook Page post.
    """
    async with AsyncClient() as client:
        url = f"{GRAPH}/{FB_PAGE_ID}/feed"
        params = {
            "message": message,
            "access_token": PAGE_ACCESS_TOKEN
        }
        resp = await client.post(url, params=params)
        data = resp.json()
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"]["message"])
        return {"success": True, "post_id": data.get("id"), "data": data}


async def create_fb_photo_post(
    db: AsyncSession,
    message: str,
    photo_urls: Optional[List[str]] = None,
    image_files: Optional[List[bytes]] = None,
    image_filenames: Optional[List[str]] = None
):
    """
    Create a Facebook Page post with one or more photos.
    """
    if photo_urls is None:
        photo_urls = []
    if image_files is None:
        image_files = []
    if image_filenames is None:
        image_filenames = []
    if len(image_files) != len(image_filenames):
        raise ValueError("image_files and image_filenames length mismatch")

    async with AsyncClient() as client:
        # Case: one photo
        if len(photo_urls) + len(image_files) == 1:
            url = f"{GRAPH}/{FB_PAGE_ID}/photos"
            params = {
                "message": message,
                "access_token": PAGE_ACCESS_TOKEN
            }
            files = None
            if photo_urls:
                params["url"] = photo_urls[0]
            else:
                files = {"source": (image_filenames[0], image_files[0], "image/jpeg")}

            resp = await client.post(url, params=params, files=files)
            data = resp.json()
            if "error" in data:
                raise HTTPException(status_code=400, detail=data["error"]["message"])
            return {"success": True, "photo_post_id": data.get("id"), "data": data}

        # Case: multiple photos → upload each unpublished + attach
        photo_ids = []
        # upload URL photos
        for pu in photo_urls:
            up_url = f"{GRAPH}/{FB_PAGE_ID}/photos"
            params = {"access_token": PAGE_ACCESS_TOKEN, "url": pu, "published": "false"}
            resp = await client.post(up_url, params=params)
            d = resp.json()
            if "error" in d:
                raise HTTPException(status_code=400, detail=f"Error uploading photo URL: {d['error']['message']}")
            photo_ids.append(d["id"])

        # upload file photos
        for img_bytes, fname in zip(image_files, image_filenames):
            up_url = f"{GRAPH}/{FB_PAGE_ID}/photos"
            params = {"access_token": PAGE_ACCESS_TOKEN, "published": "false"}
            files = {"source": (fname, img_bytes, "image/jpeg")}
            resp = await client.post(up_url, params=params, files=files)
            d = resp.json()
            if "error" in d:
                raise HTTPException(status_code=400, detail=f"Error uploading photo file: {d['error']['message']}")
            photo_ids.append(d["id"])

        # attach to feed
        feed_url = f"{GRAPH}/{FB_PAGE_ID}/feed"
        params = {
            "message": message,
            "access_token": PAGE_ACCESS_TOKEN,
            "attached_media": [{"media_fbid": pid} for pid in photo_ids]
        }
        resp = await client.post(feed_url, json=params)
        data = resp.json()
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"]["message"])
        return {"success": True, "post_id": data.get("id"), "data": data}
        


