"""Image upload compatibility checks. Run: python -m unittest discover -s tests -v."""

import io
import subprocess
import sys
import unittest

from PIL import Image
from pi_heif import register_heif_opener

from services.image_tools import process_image, resize_image


class ImageProcessingTests(unittest.TestCase):
    def test_resize_preserves_existing_dimensions(self):
        for original, expected in [
            ((1400, 900), (700, 450)),
            ((900, 1400), (450, 700)),
            ((1000, 1000), (700, 700)),
            ((70, 35), (700, 350)),
        ]:
            with self.subTest(original=original):
                self.assertEqual(resize_image(Image.new("RGB", original)).size, expected)

    def test_upload_formats_convert_to_readable_webp(self):
        for source_format, mode in [
            ("JPEG", "RGB"), ("PNG", "RGB"), ("PNG", "RGBA"),
            ("PNG", "L"), ("PNG", "P"), ("WEBP", "RGB"),
            ("GIF", "P"), ("TIFF", "RGB"), ("BMP", "RGB"),
        ]:
            with self.subTest(source_format=source_format, mode=mode):
                source = Image.new(mode, (80, 40))
                if mode == "RGBA":
                    source.putalpha(128)
                stream = io.BytesIO()
                source.save(stream, format=source_format)
                stream.seek(0)
                with Image.open(stream) as uploaded:
                    result = process_image(uploaded)
                with Image.open(io.BytesIO(result)) as output:
                    output.load()
                    self.assertEqual(output.format, "WEBP")
                    self.assertEqual(output.size, (700, 350))
                    self.assertEqual(output.mode, "RGBA" if mode == "RGBA" else "RGB")
                    if mode == "RGBA":
                        self.assertEqual(output.getchannel("A").getextrema(), (128, 128))

    def test_heif_opener_registration(self):
        register_heif_opener()
        self.assertEqual(Image.registered_extensions()[".heic"], "HEIF")
        self.assertIn("HEIF", Image.OPEN)

    def test_malformed_eps_is_rejected_without_hanging(self):
        # Isolate parsing so a regression cannot hang the test runner.
        script = """
import io
from PIL import Image
payload = (b'%!PS-Adobe-3.0 EPSF-3.0\\n%%BoundingBox: 0 0 1 1\\n'
           b'%%EndComments\\n% dummy comment after transition\\n'
           b'%%BeginBinary:-18\\n%%EOF\\n')
try:
    Image.open(io.BytesIO(payload))
except (OSError, SyntaxError, ValueError):
    pass
else:
    raise AssertionError('Malformed EPS was accepted')
"""
        subprocess.run([sys.executable, "-c", script], check=True, timeout=5)


if __name__ == "__main__":
    unittest.main()
