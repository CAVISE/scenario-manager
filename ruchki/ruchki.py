import subprocess
import time
import os

def main():
    # команда для запуска карлы
    carla_path = r"E:\Downloads\CARLA_0.9.14\WindowsNoEditor\CarlaUE4.exe"
    carla_args = [
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
            "-t", "single_2lanefree_carla",
            "-v", "0.9.14"
        ]

        print("Запускаем OpenCDA с параметрами:", opencda_params)
        subprocess.run(
            ["conda", "run", "-n", "opencda", "python", "run_opencda.py"] + opencda_params,
            shell=True,
            cwd=os.getcwd()
        )

        #opencda_cmd = "python run_opencda.py"
    
        #subprocess.run(opencda_cmd, shell=True, cwd=os.getcwd())

        
    finally:
        # остановка карлы после сценария (или если с opencda какая то проблема возникла)
        print("OpenCDA завершён. Останавка CARLA...")
        stop_carla_windows(carla_process)


def stop_carla_windows(proc):
    #принудительно убивает процесс (CarlaUE4.exe) и все его дочерние процессы на Windows.
    try:
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"Не удалось остановить процесс CARLA: {e}")

    
if __name__ == "__main__":
    main()
