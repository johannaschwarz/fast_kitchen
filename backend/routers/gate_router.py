import hmac
import os

from fastapi import APIRouter, HTTPException, Request, Response, status
from gate import GateRequired, issue_gate_token, load_gate_settings
from pydantic import BaseModel

gate_router = APIRouter(tags=["Gate"])

GATE_COOKIE_NAME = "gate_token"


class GateUnlockRequest(BaseModel):
    passphrase: str


class GateTokenResponse(BaseModel):
    token_type: str = "cookie"
    expires_in: int


def _cookie_secure(request: Request) -> bool:
    """Use a Secure cookie on HTTPS, but allow plain HTTP for local development."""
    configured = os.getenv("GATE_COOKIE_SECURE")
    if configured:
        return configured.strip().lower() not in {"0", "false", "no", "off"}

    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    return (
        request.url.scheme == "https"
        or forwarded_proto.split(",")[0].strip() == "https"
    )


@gate_router.post("/gate/unlock")
async def unlock(
    payload: GateUnlockRequest, request: Request, response: Response
) -> GateTokenResponse:
    settings = load_gate_settings()

    if not hmac.compare_digest(
        payload.passphrase.encode("utf-8"),
        settings["passphrase"].encode("utf-8"),
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Das Zugangspasswort ist nicht korrekt.",
        )

    token, expires_in = issue_gate_token(settings)

    # Host-only cookie for api.flottekueche.de. The frontend never sees the token.
    response.set_cookie(
        key=GATE_COOKIE_NAME,
        value=token,
        max_age=expires_in,
        httponly=True,
        secure=_cookie_secure(request),
        samesite="lax",
        path="/",
    )

    return GateTokenResponse(expires_in=expires_in)


@gate_router.get("/gate/verify")
async def verify(_gate: GateRequired) -> dict:
    return {"valid": True}
