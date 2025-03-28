
import io
from PIL import Image as PILImage

SIZE = (700, 700)

def resize_image(image: PILImage) -> PILImage:
    """Resize the image to the given size."""
    if image.size[0] > image.size[1]:
        new_width = SIZE[0]
        new_height = int(SIZE[0] * image.size[1] / image.size[0])
    else:
        new_height = SIZE[1]
        new_width = int(SIZE[1] * image.size[0] / image.size[1])
    return image.resize((new_width, new_height))


def process_image(image: PILImage) -> bytes:
    """Process the image to fit the given size."""
    
    image = resize_image(image)

    with io.BytesIO() as output:
        image.save(output, format="webp", optimize=True, quality=80)
        return output.getvalue()