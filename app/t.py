

def func():
    # пишет в файл /assets/1.txt - 123
    with open('assets/1.txt', 'w') as f:
        f.write('123')