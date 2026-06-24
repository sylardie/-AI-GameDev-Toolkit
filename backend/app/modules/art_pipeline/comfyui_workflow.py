import copy
import random

from app.schemas.art import ArtPromptGenerateRequest
from app.schemas.settings import ComfyUISettings


class ComfyUIWorkflowError(Exception):
    pass


def build_template_txt2img_workflow(
    positive_prompt: str,
    negative_prompt: str,
    width: int,
    height: int,
    seed: int,
    batch_size: int = 1,
    settings: ComfyUISettings | None = None,
) -> dict:
    settings = settings or ComfyUISettings()
    workflow = load_workflow_template(settings)
    missing_mappings = [
        label
        for label, node_id in (
            ("positive prompt", settings.positive_prompt_node_id),
            ("negative prompt", settings.negative_prompt_node_id),
            ("sampler", settings.sampler_node_id),
            ("latent image", settings.latent_node_id),
        )
        if not node_id.strip()
    ]
    if missing_mappings:
        raise ComfyUIWorkflowError(
            f"ComfyUI node mapping is incomplete: {', '.join(missing_mappings)}."
        )
    resolved_seed = seed if seed >= 0 else random.randint(1, 2_147_483_647)

    _set_node_input(workflow, settings.positive_prompt_node_id, "text", positive_prompt)
    _set_node_input(workflow, settings.negative_prompt_node_id, "text", negative_prompt)
    _set_node_input(workflow, settings.sampler_node_id, "seed", resolved_seed)
    _set_node_input(workflow, settings.sampler_node_id, "steps", settings.steps)
    _set_node_input(workflow, settings.sampler_node_id, "cfg", settings.cfg)
    _set_node_input(workflow, settings.latent_node_id, "width", width)
    _set_node_input(workflow, settings.latent_node_id, "height", height)
    _set_node_input(workflow, settings.latent_node_id, "batch_size", batch_size)

    return workflow


def load_workflow_template(settings: ComfyUISettings) -> dict:
    if not settings.workflow:
        raise ComfyUIWorkflowError(
            "ComfyUI workflow is empty. Import an API Format JSON workflow in Settings."
        )
    if "nodes" in settings.workflow:
        raise ComfyUIWorkflowError(
            "ComfyUI workflow is UI Format. Export it with 'Save (API Format)' in ComfyUI."
        )
    return copy.deepcopy(settings.workflow)


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
    return build_template_txt2img_workflow(
        positive_prompt=positive_prompt,
        negative_prompt=negative_prompt,
        width=settings.width,
        height=settings.height,
        seed=settings.seed,
        settings=settings,
    )


def _filename_prefix(request: ArtPromptGenerateRequest) -> str:
    return f"ai_toolkit_{request.asset_type}_{request.style}"
