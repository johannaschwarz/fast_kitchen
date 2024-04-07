import json

from PIL import Image as PILImage

SIZE = (700, 700)


def load_config() -> dict:
    """Load the configuration from the config.json file."""
    with open("assets/config.json", encoding="utf-8") as f:
        return json.load(f)


def load_credentials() -> dict:
    """Load the credentials from the creds.json file."""
    with open("assets/creds.json", encoding="utf-8") as f:
        return json.load(f)


def resize_image(image: PILImage) -> PILImage:
    """Resize the image to the given size."""
    if image.size[0] > image.size[1]:
        new_width = SIZE[0]
        new_height = int(SIZE[0] * image.size[1] / image.size[0])
    else:
        new_height = SIZE[1]
        new_width = int(SIZE[1] * image.size[0] / image.size[1])
    return image.resize((new_width, new_height))
