### Установка виртуального окружения

Для установки uv(ультра быстрый pip) - можно и обычным pip, но тогда не получится пользоватсья файлом .in
```sh
python3.9 -m pip install uv
```

Для установки виртуального окружения через uv
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