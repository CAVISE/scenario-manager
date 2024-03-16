import os
import glob
from PIL import Image
import torch

# подгружаем модель
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

def process_and_detect_images(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # бегаем по всем файлам в папке входной
    for image_path in glob.glob(os.path.join(input_dir, '*')):
        if image_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            image = Image.open(image_path)
            original_size = image.size

            # подготовка изображения для детекции
            original_image = image
            downscaled_image = image.resize((original_size[0] // 2, original_size[1] // 2))
            upscaled_image = downscaled_image.resize(original_size)

            
            #сохраняем оригинальное, уменьшенное и увеличенное изображение без детекций
            original_image.save(os.path.join(output_dir, os.path.basename(image_path)))
            downscaled_image.save(os.path.join(output_dir, os.path.basename(image_path).replace('.', '_downscaled.')))
            upscaled_image.save(os.path.join(output_dir, os.path.basename(image_path).replace('.', '_upscaled.')))

            for version in ['original', 'downscaled', 'upscaled']:
                if version == 'original':
                    results = model(image)
                elif version == 'downscaled':
                    results = model(downscaled_image)
                else:  # version == 'upscaled'
                    results = model(upscaled_image)


                # сохранение именно изображения с детекциями
                detected_image_path = os.path.join(output_dir, os.path.basename(image_path).replace('.', f'_{version}_detected.'))
                results.render()  # именно эта хрень добавляет квадратики на изображение
                detected_image = Image.fromarray(results.ims[0])
                detected_image.save(detected_image_path)

if __name__ == '__main__':
    input_dir = 'in'
    output_dir = 'out'
    process_and_detect_images(input_dir, output_dir)
