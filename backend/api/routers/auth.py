import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError, PyMongoError

from api.deps import get_current_user
from core.config import settings
from core.security import create_access_token, hash_password, verify_password
from db.mongo import get_users_collection
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_user(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        created_at=doc["created_at"],
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest):
    users = get_users_collection()

    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower().strip(),
        "hashed_password": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {exc}") from exc

    user_doc["_id"] = result.inserted_id
    user_out = _serialize_user(user_doc)

    token = create_access_token(subject=str(result.inserted_id))
    return TokenResponse(access_token=token, user=user_out)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    users = get_users_collection()

    try:
        user_doc = users.find_one({"email": payload.email.lower().strip()})
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {exc}") from exc

    if not user_doc or not verify_password(payload.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(subject=str(user_doc["_id"]))
    return TokenResponse(access_token=token, user=_serialize_user(user_doc))


@router.get("/me", response_model=UserOut)
def me(current_user: dict = Depends(get_current_user)):
    return _serialize_user(current_user)


@router.post("/demo", response_model=TokenResponse, status_code=201)
def demo_login():
    """
    Provisions a fresh, disposable demo account and logs straight into it --
    no form to fill in. Each call creates its own account (with its own full
    quota of chats/messages) so multiple people trying the demo at once don't
    share -- and exhaust -- a single account's limits.
    """
    if not settings.demo_accounts_enabled:
        raise HTTPException(status_code=404, detail="Demo accounts are disabled.")

    users = get_users_collection()
    suffix = uuid.uuid4().hex[:8]

    user_doc = {
        "name": "Demo User",
        "email": f"demo-{suffix}@demo.guest",
        "hashed_password": hash_password(secrets.token_urlsafe(24)),
        "created_at": datetime.now(timezone.utc),
        "is_demo": True,
    }

    try:
        result = users.insert_one(user_doc)
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {exc}") from exc

    user_doc["_id"] = result.inserted_id
    token = create_access_token(subject=str(result.inserted_id))
    return TokenResponse(access_token=token, user=_serialize_user(user_doc))
