import httpx
from fastapi import HTTPException, status

from backend.core.config import get_settings


class SupabaseRepository:
    """Small async PostgREST/Storage client; all access stays server-side."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def _headers(self, *, prefer: str | None = None) -> dict[str, str]:
        if not self.settings.supabase_ready:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        headers = {
            "apikey": self.settings.supabase_service_role_key or "",
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    async def request(self, method: str, path: str, *, params: dict | None = None, json: object | None = None, headers: dict | None = None) -> object:
        request_headers = self._headers()
        request_headers.update(headers or {})
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(method, f"{self.settings.supabase_url}/rest/v1/{path}", params=params, json=json, headers=request_headers)
        if response.is_error:
            raise HTTPException(status_code=response.status_code, detail=f"Database request failed: {response.text[:300]}")
        return response.json() if response.content else None

    async def insert(self, table: str, row: dict) -> dict:
        result = await self.request("POST", table, json=row, headers={"Prefer": "return=representation"})
        return result[0]

    async def update(self, table: str, match: dict[str, str], row: dict) -> list[dict]:
        return await self.request("PATCH", table, params=match, json=row, headers={"Prefer": "return=representation"})

    async def upload(self, path: str, data: bytes, mime_type: str) -> None:
        headers = self._headers()
        headers["Content-Type"] = mime_type
        headers["x-upsert"] = "false"
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{self.settings.supabase_url}/storage/v1/object/{self.settings.supabase_storage_bucket}/{path}", content=data, headers=headers)
        if response.is_error:
            raise HTTPException(status_code=response.status_code, detail=f"Document storage failed: {response.text[:300]}")
