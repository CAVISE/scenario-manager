import subprocess
import sys
import time
import os
sys.path.append('..')


def stop_carla_windows(proc):
    # принудительно убивает процесс (CarlaUE4.exe) и все его дочерние процессы на Windows.
    try:
        # windows kill carla
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        # linux kill carla
        subprocess.run(
            ["pkill", "-f", "CarlaUE4"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"Не удалось остановить процесс CARLA: {e}")


def main():
    # команда для запуска карлы
    carla_path = "CarlaUE4"
    carla_args = [
        "-quality-level=Low",
        "-carla-server",
        "-windowed",
        "-ResX=1280",
        "-ResY=720",
        "-benchmark",
        "-fps=20"
    ]

    # запуск карлы
    print("Запуск CARLA...")
    carla_process = subprocess.Popen([carla_path] + carla_args)

    # время чтоб карла прогрузилась
    time.sleep(10)
    try:
        print("Запуск OpenCDA...")
        opencda_params = [
            "-t", "map10",
            "-v", "0.9.15"
        ]

        print("Запускаем OpenCDA с параметрами:", opencda_params)

        python_path = str | None
        if os.name == "posix":
            python_path = "./external/OpenCDA/venv/bin/python"
        elif os.name == "nt":
            python_path = ".\\external\\OpenCDA\\venv\\Scripts\\python.exe"
        else:
            raise Exception("Unsupported OS")

        subprocess.run(
            [python_path, "run_opencda.py"] + opencda_params,
            shell=True,
            cwd=os.getcwd()
        )
        # opencda_cmd = "python run_opencda.py"

        # subprocess.run(opencda_cmd, shell=True, cwd=os.getcwd())

    finally:
        # остановка карлы после сценария (или если с opencda какая то проблема возникла)
        print("OpenCDA завершён. Останавка CARLA...")
        stop_carla_windows(carla_process)


if __name__ == "__main__":
    main()
