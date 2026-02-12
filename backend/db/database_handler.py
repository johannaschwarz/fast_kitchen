from db.database import MySQLDatabase


class AsyncDatabaseContextManager:
    """An async context manager for the database connection."""

    def __init__(self):
        self.db = None

    async def __aenter__(self):
        self.db = await MySQLDatabase.create()
        return self.db

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.db.close()


async def get_database_connection():
    async with AsyncDatabaseContextManager() as database:
        yield database
