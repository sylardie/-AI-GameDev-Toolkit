import hmac
import os

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


API_TOKEN_ENV = "AI_GAMEDEV_API_TOKEN"
API_TOKEN_HEADER = "X-AI-Toolkit-Token"


class LocalApiAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        expected_token = os.getenv(API_TOKEN_ENV, "")
        if (
            expected_token
            and request.url.path.startswith("/api/")
            and request.url.path != "/api/health"
        ):
            supplied_token = request.headers.get(API_TOKEN_HEADER, "")
            if not hmac.compare_digest(supplied_token, expected_token):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Local API authentication failed."},
                )

        return await call_next(request)
