import subprocess
import time
import os


def start_carla():
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

    print("Запуск CARLA...")
    carla_process = subprocess.Popen([carla_path] + carla_args)
    time.sleep(15)
    return carla_process


def start_opencda(scenario, version="0.9.15", map="map10"):
    print("Запуск OpenCDA...")
    opencda_params = ["-t", scenario, "-v", version, "-m", map]

    print("Запускаем OpenCDA с параметрами:", opencda_params)

    if os.name == "posix":
        python_path = "./external/OpenCDA/venv/bin/python"
    elif os.name == "nt":
        python_path = ".\\external\\OpenCDA\\venv\\Scripts\\python.exe"
    else:
        raise Exception("Unsupported OS")

    subprocess.run(
        [python_path, "run_opencda.py"] + opencda_params,
        shell=True,
    )


def stop_carla(proc):
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
        elif os.name == "posix":
            subprocess.run(
                ["pkill", "-f", "CarlaUE4"],
                check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
    except Exception as e:
        print(f"Не удалось остановить процесс CARLA: {e}")


def main():
    carla_process = None

    try:
        # carla_process = start_carla()

        # scenario = "single_2lanefree_carla"
        # scenario = "map10"
        # scenario = "map10_2"
        scenario = "map10_3"
        # scenario = "map10_4"
        start_opencda(scenario)

    finally:
        if carla_process:
            print("OpenCDA завершён. Остановка CARLA...")
            stop_carla(carla_process)


if __name__ == "__main__":
    main()
