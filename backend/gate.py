import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, Query, Response, status
from jose import JWTError, jwt

from utils import load_credentials

ALGORITHM = "HS256"
DEFAULT_TOKEN_EXPIRE_DAYS = 90
GATE_SCOPE = "gate"


def load_gate_settings() -> dict:
    """Load the gate configuration from creds.json or environment variables."""
    credentials = load_credentials()

    secret = os.getenv("GATE_SECRET") or credentials.get("gate_secret")
    passphrase = os.getenv("GATE_PASSPHRASE") or credentials.get("gate_passphrase")

    if not secret or not passphrase:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The recipe gate is not configured. Add 'gate_secret' and "
                "'gate_passphrase' to assets/creds.json (or set GATE_SECRET and "
                "GATE_PASSPHRASE)."
            ),
        )

    try:
        version = int(
            os.getenv("GATE_TOKEN_VERSION")
            or credentials.get("gate_token_version", 1)
        )
        expire_days = int(
            os.getenv("GATE_TOKEN_EXPIRE_DAYS")
            or credentials.get("gate_token_expire_days", DEFAULT_TOKEN_EXPIRE_DAYS)
        )
    except (TypeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The recipe gate configuration is invalid.",
        ) from e

    return {
        "secret": secret,
        "passphrase": passphrase,
        "version": version,
        "expire_days": expire_days,
    }


def issue_gate_token(settings: dict) -> tuple[str, int]:
    """Create a long-lived token that proves the passphrase was entered."""
    expires_delta = timedelta(days=settings["expire_days"])
    now = datetime.now(timezone.utc)

    payload = {
        "sub": "gate",
        "scope": GATE_SCOPE,
        "v": settings["version"],
        "iat": now,
        "exp": now + expires_delta,
    }

    token = jwt.encode(payload, settings["secret"], algorithm=ALGORITHM)
    return token, int(expires_delta.total_seconds())


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={
            "WWW-Authenticate": "Bearer",
            "X-Gate-Required": "1",
            "Cache-Control": "no-store",
        },
    )


def extract_gate_token(
    x_gate_token: Annotated[str | None, Header(alias="X-Gate-Token")] = None,
    gate_token: Annotated[str | None, Cookie()] = None,
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
) -> str | None:
    """Read the gate token from a header, the API cookie, or a query parameter.

    The cookie is the normal browser path: it is host-only on the API domain, so
    <img> requests to the API send it automatically. The header and query parameter
    remain available for API clients and as a fallback.
    """
    if x_gate_token:
        return x_gate_token.strip()

    if gate_token:
        return gate_token.strip()

    if token:
        return token.strip()

    if authorization:
        scheme, _, value = authorization.partition(" ")
        if scheme.lower() == "bearer" and value:
            return value.strip()

    return None


def require_gate_token(
    response: Response,
    token: Annotated[str | None, Depends(extract_gate_token)],
) -> None:
    """Reject requests that do not carry a valid, non-revoked gate token."""
    response.headers["Cache-Control"] = "private, no-store"
    settings = load_gate_settings()

    if not token:
        raise _unauthorized("Enter the passphrase to access the recipes.")

    try:
        payload = jwt.decode(token, settings["secret"], algorithms=[ALGORITHM])
    except (JWTError, ValueError) as e:
        raise _unauthorized("The access token is invalid or has expired.") from e

    if payload.get("scope") != GATE_SCOPE or payload.get("sub") != "gate":
        raise _unauthorized("The access token is invalid.")

    try:
        token_version = int(payload.get("v", -1))
    except (TypeError, ValueError) as e:
        raise _unauthorized("The access token is invalid.") from e

    if token_version != settings["version"]:
        raise _unauthorized("The access token has been revoked.")


GateRequired = Annotated[None, Depends(require_gate_token)]
