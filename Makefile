ifeq ($(OS),Windows_NT)
	PYTHON_EXEC=venv\\Scripts\\python.exe
else
	PYTHON_EXEC=venv/bin/python
endif

low:
	CarlaUE4 -quality-level=Low -carla-server -windowed -ResX=1280 -ResY=720 -fps=20

epic:
	CarlaUE4 -quality-level=Epic -carla-server -windowed -ResX=1280 -ResY=720 -benchmark -fps=20

opencda:
	$(PYTHON_EXEC) opencda_playground.py