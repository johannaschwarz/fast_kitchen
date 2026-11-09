# Recipe Manager Web App Backend

```bash
pip install -r requirements.txt
```

```bash
uvicorn app:app --reload
```

## Recipe gate (passphrase protection)

Recipes and images are only served to visitors who have entered the shared
passphrase. The backend reads the gate configuration from `assets/creds.json`:

```json
{
  "gate_secret": "a long random value that signs the gate tokens",
  "gate_passphrase": "the passphrase you share with friends",
  "gate_token_version": 1,
  "gate_token_expire_days": 90
}
```

Generate a suitable `gate_secret` with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

The same values can be provided through `GATE_SECRET`, `GATE_PASSPHRASE`,
`GATE_TOKEN_VERSION` and `GATE_TOKEN_EXPIRE_DAYS` environment variables, which
take precedence over `creds.json`.

Tokens are signed with `gate_secret`, which is separate from the user-login
`secret_key`. To revoke every issued gate token, either change `gate_secret` or
increase `gate_token_version`, then restart the backend. Changing the
passphrase only affects future unlocks; existing tokens stay valid until they
expire or one of the revocation values changes.

The passphrase itself is never sent to the browser and is only compared on the
server. This is a low-friction shared-password gate, not a replacement for the
per-user login used for creating and editing recipes.

### How the browser gets access

`POST /gate/unlock` sets a host-only `gate_token` cookie for the API domain
(`api.flottekueche.de`). The cookie is `HttpOnly`, `SameSite=Lax`, and `Secure`
when the request is HTTPS, so the frontend never handles the token itself. Image
tags pointing at the API automatically send this cookie, and normal API calls
use `credentials: 'include'`.

Because the cookie is credentialed, CORS must use explicit frontend origins.
The defaults are `https://flottekueche.de`, `https://www.flottekueche.de`,
`http://localhost:5173` and `http://127.0.0.1:5173`. Override them with a
comma-separated `FRONTEND_ORIGINS` environment variable if needed.

For local HTTP development the cookie is automatically non-`Secure`. If you
run behind a TLS-terminating proxy that does not forward `X-Forwarded-Proto`,
set `GATE_COOKIE_SECURE=true` explicitly (or `false` for plain HTTP).
