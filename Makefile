ifeq ($(OS),Windows_NT)
	PYTHON_EXEC=venv\\Scripts\\python.exe
else
	PYTHON_EXEC=venv/bin/python
endif



low: 
	export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json && \
	CarlaUE4 -quality-level=Low -RenderOffScreen -vulkan -carla-server

epic:
	CarlaUE4 -quality-level=Epic -carla-server -windowed -ResX=1280 -ResY=720 -benchmark -fps=20

opencda:
	$(PYTHON_EXEC) opencda_playground.py

<<<<<<< HEAD
=======

>>>>>>> 555f2a5 (Changes)
dev:
	$(PYTHON_EXEC) -m fastapi dev --port 1234