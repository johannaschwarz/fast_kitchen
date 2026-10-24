import io
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import aiomysql
from PIL import Image

with patch("utils.load_config", return_value={}), patch(
    "utils.load_credentials", return_value={}
):
    from db.database import MySQLDatabase

from services.image_tools import process_image


class ImageStorageTests(unittest.IsolatedAsyncioTestCase):
    async def assert_image_insert(self, image):
        connection = aiomysql.Connection()
        connection.server_status = 0
        connection._result = SimpleNamespace(
            affected_rows=1,
            description=None,
            insert_id=42,
            rows=None,
            warning_count=0,
            has_next=False,
        )
        cursor = aiomysql.Cursor(connection)
        pool = MagicMock()
        pool.acquire.return_value.__aenter__.return_value = connection

        # Only mock network I/O; use the driver's real execute/escaping code.
        with (
            patch.object(connection, "query", new_callable=AsyncMock) as query,
            patch.object(connection, "cursor", return_value=cursor),
        ):
            image_id = await MySQLDatabase(pool).create_image(image)

        self.assertEqual(image_id, 42)
        query.assert_awaited_once_with(
            f"INSERT INTO Images (Image) VALUES (UNHEX('{image.hex()}'))"
        )

    async def test_insert_preserves_all_byte_values(self):
        # Includes quotes, backslashes, NULs, and non-UTF-8 byte sequences.
        await self.assert_image_insert(bytes(range(256)))

    async def test_insert_processed_upload(self):
        with Image.new("RGB", (1200, 600), "red") as source:
            upload = io.BytesIO()
            source.save(upload, format="PNG")
        upload.seek(0)
        with Image.open(upload) as image:
            processed = process_image(image)

        with Image.open(io.BytesIO(processed)) as image:
            self.assertEqual(image.format, "WEBP")
            self.assertEqual(image.size, (700, 350))
        await self.assert_image_insert(processed)
