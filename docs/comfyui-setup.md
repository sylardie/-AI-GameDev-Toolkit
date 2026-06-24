# ComfyUI Setup

The Art Pipeline can submit image-generation workflows to a local ComfyUI instance.

## Connection

1. Start ComfyUI.
2. Confirm that its API is available, normally at `http://127.0.0.1:8188`.
3. Open Toolkit Settings → ComfyUI.
4. Enable ComfyUI, enter the Base URL, save settings, and test the connection.

A successful connection test only confirms that the ComfyUI server is reachable. It does not validate model files, custom nodes, or the complete generation workflow.

The toolkit does not include a model-specific ComfyUI generation workflow. Each user must import an API workflow that has already been tested in their own ComfyUI environment.

## Workflow setup

1. Build and run the workflow successfully inside ComfyUI.
2. Enable **Dev Mode Options** in ComfyUI settings.
3. Export the workflow with **Save (API Format)**.
4. Import the JSON in Toolkit Settings → ComfyUI.
5. Enter the API workflow node IDs for:
   - Positive prompt node with a `text` input
   - Negative prompt node with a `text` input
   - Sampler node with `seed`, `steps`, and `cfg` inputs
   - Latent image node with `width`, `height`, and `batch_size` inputs
6. Save settings.
7. Test the connection, then generate one small image from Art Pipeline.

Normal ComfyUI UI-format workflow JSON contains a top-level `nodes` field and cannot be submitted directly to the `/prompt` API.

Custom workflow JSON is stored in the toolkit's local backend settings. It is not written into an external game project.
