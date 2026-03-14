import subprocess

def main():
    # 1. Генерация docker-compose файла через compose_gen.py
    #    (Пример генерации для локальной сборки всех контейнеров)
    gen_cmd = [
        "python",                       
        "./compose_gen_for_py_37.py",            # путь до compose_gen.py       
        "-e", "base.env",              
        "-t", "base.yml",              
        "--pack", "LOCAL_BUILD"        
    ]
    
    print("Генерируем docker-compose файл...")
    subprocess.run(gen_cmd, check=True)

    compose_cmd = [
        "docker", "compose",
        "-f", "dc-configs/compose.yml",              # сгенерированный compose-файл

        "--env-file", "cavise/scripts/environments/base.env",  
        "up", "-d"
    ]

    print("Запускаем docker-compose...")
    subprocess.run(compose_cmd, check=True)

    print("Сервисы в контейнерах запущены.")

if __name__ == "__main__":
    main()
