from pydantic import BaseModel

class User(BaseModel):
    """Model for a user."""

    username: str
    disabled: bool | None = None


class UserInDB(User):
    """Model for a user in the database."""

    id_: int
    is_admin: bool
    hashed_password: str


class NewUser(BaseModel):
    username: str
    password: str
    is_admin: bool


class Authorization(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    is_admin: bool
    disabled: bool


class TokenData(BaseModel):
    user_id: int