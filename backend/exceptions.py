from fastapi import HTTPException, status


class NotFoundException(Exception):
    """Raised when a resource is not found."""


class UpdateFailedException(Exception):
    """Raised when a resource could not be updated."""


class CredentialsException(HTTPException):
    """Raised when the users credentials are invalid"""

    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"},
        )
