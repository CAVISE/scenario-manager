.PHONY: sync sync-simulation dev test frontend frontend-test low low-d epic

sync:
	uv sync

sync-simulation:
	uv sync --extra simulation

dev:
	docker compose up --build backend

test:
	uv run pytest tests/backend -q

frontend:
	yarn --cwd frontend dev

frontend-test:
	yarn --cwd frontend test

low:
	export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json && \
	CarlaUE4 -quality-level=Low -vulkan -carla-server

low-d:
	export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json && \
	CarlaUE4 -quality-level=Low -RenderOffScreen -vulkan -carla-server

epic:
	CarlaUE4 -quality-level=Epic -carla-server -windowed -ResX=1280 -ResY=720 -benchmark -fps=20
