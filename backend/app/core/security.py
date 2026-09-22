from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.config.settings import get_settings


def create_access_token(subject: str, role: str = "operator") -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": subject, "role": role, "exp": expires}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, str]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        subject = payload.get("sub")
        if not subject:
            raise ValueError("Token subject is missing")
        return {"sub": str(subject), "role": str(payload.get("role", "operator"))}
    except (JWTError, ValueError) as error:
        raise ValueError("Invalid access token") from error
