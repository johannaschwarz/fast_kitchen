import hmac
import os

from fastapi import APIRouter, HTTPException, Request, Response, status
from gate import GateRequired, issue_gate_token, load_gate_settings
from pydantic import BaseModel
from rate_limit import FailureRateLimiter

gate_router = APIRouter(tags=["Gate"])

GATE_COOKIE_NAME = "gate_token"


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


gate_failure_limiter = FailureRateLimiter(
    max_attempts=_env_int("GATE_MAX_FAILED_ATTEMPTS", 5),
    window_seconds=_env_int("GATE_ATTEMPT_WINDOW_SECONDS", 300),
    lockout_seconds=_env_int("GATE_LOCKOUT_SECONDS", 300),
)


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    # The last address was added by the trusted reverse proxy; earlier values
    # may come from the client and must not be trusted.
    forwarded_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
    if forwarded_ips:
        return forwarded_ips[-1]

    if request.client:
        return request.client.host

    return "unknown"


def _too_many_attempts(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Zu viele fehlgeschlagene Versuche. Bitte versuche es später erneut.",
        headers={
            "Retry-After": str(retry_after),
            "Cache-Control": "no-store",
        },
    )


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
    client_ip = _client_ip(request)
    retry_after = gate_failure_limiter.retry_after(client_ip)
    if retry_after is not None:
        raise _too_many_attempts(retry_after)

    settings = load_gate_settings()

    if not hmac.compare_digest(
        payload.passphrase.encode("utf-8"),
        settings["passphrase"].encode("utf-8"),
    ):
        retry_after = gate_failure_limiter.record_failure(client_ip)
        if retry_after is not None:
            raise _too_many_attempts(retry_after)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Das Zugangspasswort ist nicht korrekt.",
            headers={"Cache-Control": "no-store"},
        )

    gate_failure_limiter.reset(client_ip)

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
