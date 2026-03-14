ifeq ($(OS),Windows_NT)
	PYTHON_EXEC=venv\\Scripts\\python.exe
else
	PYTHON_EXEC=venv/bin/python
endif

setup:
	python3 -m venv venv

sync:
	$(PYTHON_EXEC) -m pip install -r requirements.txt
	
dev:
	$(PYTHON_EXEC) -m fastapi dev --port 1234

frontend:
	cd frontend && yarn run dev

low: 
	export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json && \
	CarlaUE4 -quality-level=Low -vulkan -carla-server

low-d:  # запуск без окна, чуть меньше нагрузки на GPU
	export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json && \
	CarlaUE4 -quality-level=Low -RenderOffScreen -vulkan -carla-server



# БЕСПОЛЕЗНО

epic:
	CarlaUE4 -quality-level=Epic -carla-server -windowed -ResX=1280 -ResY=720 -benchmark -fps=20

opencda:
	$(PYTHON_EXEC) opencda_playground.py