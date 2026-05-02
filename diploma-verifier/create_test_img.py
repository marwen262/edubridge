from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (200, 100), color = (255, 255, 255))
d = ImageDraw.Draw(img)
d.text((10,10), "Hello Tesseract", fill=(0,0,0))
img.save('test.png')
