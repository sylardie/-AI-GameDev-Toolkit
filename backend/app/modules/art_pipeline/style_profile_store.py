import json
from datetime import datetime
from uuid import uuid4

from app.core.config import CONFIG_DIR
from app.schemas.art import (
    ArtStyleProfile,
    ArtStyleProfileCreate,
    ArtStyleProfileListResponse,
)


STYLE_PROFILES_PATH = CONFIG_DIR / "art_style_profiles.json"


def list_style_profiles() -> ArtStyleProfileListResponse:
    return ArtStyleProfileListResponse(profiles=_load_profiles())


def get_style_profile(profile_id: str) -> ArtStyleProfile | None:
    for profile in _load_profiles():
        if profile.id == profile_id:
            return profile
    return None


def create_style_profile(request: ArtStyleProfileCreate) -> ArtStyleProfile:
    now = datetime.now().isoformat(timespec="seconds")
    profile = ArtStyleProfile(
        id=f"style_{uuid4().hex[:10]}",
        created_at=now,
        updated_at=now,
        **request.model_dump(),
    )
    profiles = _load_profiles()
    profiles.insert(0, profile)
    _save_profiles(profiles)
    return profile


def update_style_profile(
    profile_id: str,
    request: ArtStyleProfileCreate,
) -> ArtStyleProfile | None:
    profiles = _load_profiles()
    for index, profile in enumerate(profiles):
        if profile.id != profile_id:
            continue

        updated = ArtStyleProfile(
            id=profile.id,
            created_at=profile.created_at,
            updated_at=datetime.now().isoformat(timespec="seconds"),
            **request.model_dump(),
        )
        profiles[index] = updated
        _save_profiles(profiles)
        return updated
    return None


def delete_style_profile(profile_id: str) -> bool:
    profiles = _load_profiles()
    kept = [profile for profile in profiles if profile.id != profile_id]
    if len(kept) == len(profiles):
        return False
    _save_profiles(kept)
    return True


def _load_profiles() -> list[ArtStyleProfile]:
    if not STYLE_PROFILES_PATH.exists():
        return []

    with STYLE_PROFILES_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    return [ArtStyleProfile(**item) for item in data.get("profiles", [])]


def _save_profiles(profiles: list[ArtStyleProfile]) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with STYLE_PROFILES_PATH.open("w", encoding="utf-8") as file:
        json.dump(
            {"profiles": [profile.model_dump() for profile in profiles]},
            file,
            ensure_ascii=False,
            indent=2,
        )
