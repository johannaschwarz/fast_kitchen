from database import MySQLDatabase


class DatabaseContextManager:
    """A context manager for the database connection."""

    def __init__(self):
        self.db = MySQLDatabase()

    def __enter__(self):
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()


async def get_database_connection():
    with DatabaseContextManager() as database:
        yield database
