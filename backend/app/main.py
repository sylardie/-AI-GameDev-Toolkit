import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.core.config import ensure_app_dirs
from app.api.design import router as design_router
from app.api.code import router as code_router
from app.api.configs import router as configs_router
from app.api.art import router as art_router
from app.api.assets import router as assets_router
from app.api.audio import router as audio_router
from app.api.files import router as files_router
from app.api.settings import router as settings_router


ensure_app_dirs()

app = FastAPI(
    title="AI GameDev Toolkit",
    description="An AI-powered toolkit for game design, code assistance, and art production.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "name": "AI GameDev Toolkit",
        "version": "0.1.0",
        "status": "running",
        "asset_sampling_version": 2,
    }


app.include_router(design_router)
app.include_router(code_router)
app.include_router(configs_router)
app.include_router(art_router)
app.include_router(assets_router)
app.include_router(audio_router)
app.include_router(files_router)
app.include_router(settings_router)


FRONTEND_DIR = Path(os.getenv("AI_GAMEDEV_FRONTEND_DIR", "")).resolve()


if FRONTEND_DIR.is_dir() and (FRONTEND_DIR / "index.html").is_file():
    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        requested = (FRONTEND_DIR / full_path).resolve()
        if FRONTEND_DIR in requested.parents and requested.is_file():
            return FileResponse(requested)
        return FileResponse(FRONTEND_DIR / "index.html")
