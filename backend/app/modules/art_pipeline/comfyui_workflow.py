import random

from app.schemas.art import ArtPromptGenerateRequest
from app.schemas.settings import ComfyUISettings


def build_basic_txt2img_workflow(
    request: ArtPromptGenerateRequest,
    positive_prompt: str,
    negative_prompt: str,
    settings: ComfyUISettings,
) -> dict:
    seed = settings.seed if settings.seed >= 0 else random.randint(1, 2_147_483_647)

    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": settings.steps,
                "cfg": settings.cfg,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "model.safetensors",
            },
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": settings.width,
                "height": settings.height,
                "batch_size": 1,
            },
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": positive_prompt,
                "clip": ["4", 1],
            },
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": negative_prompt,
                "clip": ["4", 1],
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2],
            },
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": _filename_prefix(request),
                "images": ["8", 0],
            },
        },
    }


def _filename_prefix(request: ArtPromptGenerateRequest) -> str:
    return f"ai_toolkit_{request.asset_type}_{request.style}"
