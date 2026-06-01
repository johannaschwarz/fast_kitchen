from db.database import MySQLDatabase

_db: MySQLDatabase | None = None


async def init_database() -> None:
    """Create the shared connection pool (call once at app startup)."""
    global _db
    if _db is None:
        _db = await MySQLDatabase.create()


async def shutdown_database() -> None:
    """Close the shared connection pool (call once at app shutdown)."""
    global _db
    if _db is not None:
        await _db.close()
        _db = None


def _require_database() -> MySQLDatabase:
    if _db is None:
        raise RuntimeError("Database pool is not initialized")
    return _db


class AsyncDatabaseContextManager:
    """Async context manager that yields the shared database instance."""

    async def __aenter__(self) -> MySQLDatabase:
        return _require_database()

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        pass


async def get_database_connection():
    yield _require_database()
