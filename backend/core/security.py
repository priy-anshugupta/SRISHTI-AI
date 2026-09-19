from dataclasses import dataclass
from fastapi import Depends, Header, HTTPException, status
import jwt

from backend.core.config import get_settings


@dataclass(frozen=True)
class CurrentUser:
    id: str | None
    role: str


def current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    settings = get_settings()
    if not settings.require_auth:
        return CurrentUser(id=None, role="admin")
    if not authorization or not authorization.startswith("Bearer ") or not settings.supabase_jwt_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        claims = jwt.decode(authorization.removeprefix("Bearer "), settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token") from exc
    role = claims.get("app_metadata", {}).get("srishti_role", "viewer")
    return CurrentUser(id=claims.get("sub"), role=role)


def require_roles(*roles: str):
    def guard(user: CurrentUser = Depends(current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return guard
