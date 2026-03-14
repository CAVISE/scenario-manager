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

    print("Launch CARLA...")
    carla_process = subprocess.Popen([carla_path] + carla_args)
    time.sleep(15)
    return carla_process


def start_opencda(scenario, map):
    version = "0.9.15"
    print("Launch OpenCDA...")
    opencda_params = ["-t", scenario, "-v", version, "-m", map]

    _program = "run_opencda.py"

    if os.name == "posix":
        python_path = f"venv/bin/python {_program}"
    elif os.name == "nt":
        python_path = f".\\external\\OpenCDA\\venv\\Scripts\\python.exe {_program}"
    else:
        raise Exception("Unsupported OS")
    env = os.environ.copy()

    env["PYTHONPATH"] = os.path.abspath("opencda") + os.pathsep + env.get("PYTHONPATH", "")
    subprocess.run(
        [python_path] + opencda_params,
        shell=True,
        env=env
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
        print(f"Failed to stop process CARLA: {e}")


def main():
    carla_process = None

    try:
        scenario = "map10_4"
        start_opencda(scenario, "map10")

    finally:
        if carla_process:
            print("OpenCDA is complete. Stop CARLA...")
            stop_carla(carla_process)


if __name__ == "__main__":
    main()
