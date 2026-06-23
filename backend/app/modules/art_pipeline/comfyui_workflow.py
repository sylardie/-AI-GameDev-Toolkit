import copy
import json
import random

from app.core.config import DATA_DIR
from app.schemas.art import ArtPromptGenerateRequest
from app.schemas.settings import ComfyUISettings


WORKFLOW_TEMPLATE_PATH = DATA_DIR / "comfyui_workflows" / "basic_txt2img.json"
POSITIVE_PROMPT_NODE_ID = "11"
NEGATIVE_PROMPT_NODE_ID = "12"
KSAMPLER_NODE_ID = "19"
LATENT_NODE_ID = "28"


class ComfyUIWorkflowError(Exception):
    pass


def build_template_txt2img_workflow(
    positive_prompt: str,
    negative_prompt: str,
    width: int,
    height: int,
    seed: int,
    batch_size: int = 1,
) -> dict:
    workflow = load_workflow_template()
    resolved_seed = seed if seed >= 0 else random.randint(1, 2_147_483_647)

    _set_node_input(workflow, POSITIVE_PROMPT_NODE_ID, "text", positive_prompt)
    _set_node_input(workflow, NEGATIVE_PROMPT_NODE_ID, "text", negative_prompt)
    _set_node_input(workflow, KSAMPLER_NODE_ID, "seed", resolved_seed)
    _set_node_input(workflow, LATENT_NODE_ID, "width", width)
    _set_node_input(workflow, LATENT_NODE_ID, "height", height)
    _set_node_input(workflow, LATENT_NODE_ID, "batch_size", batch_size)

    return workflow


def load_workflow_template() -> dict:
    if not WORKFLOW_TEMPLATE_PATH.exists():
        raise ComfyUIWorkflowError(
            f"ComfyUI workflow template not found: {WORKFLOW_TEMPLATE_PATH}"
        )

    try:
        with WORKFLOW_TEMPLATE_PATH.open("r", encoding="utf-8") as file:
            workflow = json.load(file)
    except json.JSONDecodeError as exc:
        raise ComfyUIWorkflowError(f"ComfyUI workflow template is invalid JSON: {exc}") from exc

    if not isinstance(workflow, dict) or "nodes" in workflow:
        raise ComfyUIWorkflowError("ComfyUI workflow must be saved in API Format.")

    return copy.deepcopy(workflow)


def _set_node_input(workflow: dict, node_id: str, input_name: str, value) -> None:
    node = workflow.get(node_id)
    if not isinstance(node, dict):
        raise ComfyUIWorkflowError(f"ComfyUI workflow node {node_id} was not found.")

    inputs = node.get("inputs")
    if not isinstance(inputs, dict):
        raise ComfyUIWorkflowError(f"ComfyUI workflow node {node_id} has no inputs.")

    if input_name not in inputs:
        raise ComfyUIWorkflowError(
            f"ComfyUI workflow node {node_id} has no input named {input_name}."
        )

    inputs[input_name] = value


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
