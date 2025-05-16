### Установка виртуального окружения

Для установки uv(быстрый pip) - можно и обычным pip, но тогда не получится пользоватсья файлом .in
```sh
python3.9 -m pip install uv
```

Для установки виртуального окружения через uv
(лично у меня этот вариант то работает, то нет, но разработчики рекомендовали мне именно его)
```sh
uv venv venv --python python3.9
```

Активация окружения
```sh
source venv/bin/activate
```

Преобразование .in файла в requirements.txt
```sh
uv pip compile r.in -o r.txt
```

Установка зависимойстей
```sh
uv pip install -r r.txt
```

Запуск сценария
```sh
python filename.py
```

Для запуска обработки детекции(позже переведу это в докер)
```sh 
cd detections
uv venv venv
uv pip sync r.txt
python detection.py
```

# Работа с симулятором

## Установка симулятора Carla

Крайне рекомендуется для единичного использования скачивать пакетную версию
https://github.com/carla-simulator/carla/blob/master/Docs/download.md

После скачивания нужной версии(в проекте используется 0.9.15) в терминале написать одноу из команд где параметр quality-level отвечает за уровень детализации с соотвествующим названию уровнем.

При запуске не на Linux а в Windows системе, вместо ```./CarlaUE4.sh``` писать ```.\CarlaUE4.exe```.

```sh
./CarlaUE4.sh -quality-level=Epic

./CarlaUE4.sh -quality-level=High

./CarlaUE4.sh -quality-level=Medium

./CarlaUE4.sh -quality-level=Low
```

Для работы с массовыми симуляциями(потребуется очень мощный компьютер) можно использовать docker контейнер которые уже находится в папке с проектом в docker-compose файле.

Для его запуска в терминал нужно писать 

```sh
docker compose up
```

## Установка зависимостей проекта

В первую очередь переходим в папку с менеджером сценариев ./simulation

Далее по инструкции в начале файла README.md устанавливаем виртуальное окружение и активируем его.

## Запуск проекта

Если симулятор запущен, то пишем в корне папки ./simulation -  ```python main.py```



docker build -t carla:idle .

xhost +local:root
sudo docker run --privileged --gpus all --net host -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix --name carla_idle carla:idle
docker exec -it carla_idle bash

# внутри контейнера
./CarlaUE4.sh -quality-level=Low
./CarlaUE4.sh -quality-level=Low -RenderOffScreen