from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

from database import Database
from database_handler import get_database_connection
from exceptions import CredentialsException, NotFoundException
from models import Authorization, NewUser, UserInDB
from utils import load_credentials

user_router = APIRouter(tags=["User"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = load_credentials()["secret_key"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360


def verify_password(plain_password, hashed_password) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def get_password_hash(password: str) -> str:
    return str(bcrypt.hashpw(password.encode(), bcrypt.gensalt()), encoding="utf-8")


def authenticate_user(
    database: Database, username: str, password: str
) -> UserInDB | None:
    try:
        user = database.get_user_by_username(username)

        return user if verify_password(password, user.hashed_password) else None

    except NotFoundException:
        return None


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    database: Annotated[Database, Depends(get_database_connection)],
) -> UserInDB:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id: int = int(payload.get("sub"))
        if not user_id:
            raise CredentialsException()

        return database.get_user_by_id(user_id)
    except (JWTError, NotFoundException) as e:
        raise CredentialsException() from e


async def get_current_active_user(
    current_user: Annotated[UserInDB, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


@user_router.post("/token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    database: Annotated[Database, Depends(get_database_connection)],
) -> Authorization:
    user = authenticate_user(database, form_data.username, form_data.password)
    if not user:
        raise CredentialsException()

    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token = create_access_token(data={"sub": str(user.id_)})
    return Authorization(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id_,
        is_admin=user.is_admin,
        disabled=user.disabled,
    )


@user_router.post("/user/create")
def create_user(
    new_user: NewUser,
    database: Annotated[Database, Depends(get_database_connection)],
    user: Annotated[UserInDB, Depends(get_current_active_user)],
) -> NewUser | None:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You do not have permission to create users",
        )
    hashed_password = get_password_hash(new_user.password)
    try:
        if database.create_user(new_user.username, hashed_password, new_user.is_admin):
            return new_user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Failed to create user as the username already exists",
        )
    return None
