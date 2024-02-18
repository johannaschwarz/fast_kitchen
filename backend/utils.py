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
    return image.resize(SIZE)
