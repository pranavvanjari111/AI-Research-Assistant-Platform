from functools import lru_cache

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import PyMongoError

from core.config import settings
from core.security import decode_access_token
from db.mongo import get_users_collection
from ml.services.document_service import DocumentService
from ml.services.chat_service import ChatService
from ml.evaluation.evaluator import Evaluator

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """
    Resolves the authenticated user from the Authorization: Bearer <token> header.
    Raises 401 if the token is missing, invalid, expired, or the user no longer exists.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = ObjectId(payload["sub"])
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")

    try:
        user_doc = get_users_collection().find_one({"_id": user_id})
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {exc}") from exc

    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return user_doc


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict | None:
    """Like get_current_user, but returns None instead of raising when there's
    no (or an invalid) token -- for endpoints that work either way, like /status."""
    if credentials is None or not credentials.credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None
    try:
        user_id = ObjectId(payload["sub"])
    except InvalidId:
        return None
    try:
        return get_users_collection().find_one({"_id": user_id})
    except PyMongoError:
        return None


# --- Per-user document/chat services -----------------------------------
#
# IMPORTANT: these are keyed by user id. A single global DocumentService
# used to be shared by every request, which meant one user's uploaded
# documents (and vectorstore) were visible and queryable by every other
# user. Each user now gets their own DocumentService, backed by their own
# raw-file directory and their own FAISS index directory.

_document_services: dict[str, DocumentService] = {}
_chat_services: dict[str, ChatService] = {}


def get_document_service_for_user(user_id: str) -> DocumentService:
    service = _document_services.get(user_id)
    if service is None:
        service = DocumentService(
            raw_dir=settings.raw_data_dir_for(user_id),
            vector_db_dir=settings.vector_db_dir_for(user_id),
        )
        _document_services[user_id] = service
    return service


def get_document_service(current_user: dict = Depends(get_current_user)) -> DocumentService:
    return get_document_service_for_user(str(current_user["_id"]))


def get_chat_service_for_user(user_id: str) -> ChatService:
    service = _chat_services.get(user_id)
    if service is not None:
        return service

    document_service = get_document_service_for_user(user_id)
    if document_service.vectorstore is None:
        raise RuntimeError(
            "Your knowledge base hasn't been created yet. Upload a document first."
        )

    service = ChatService(document_service.vectorstore)
    _chat_services[user_id] = service
    return service


def get_chat_service(current_user: dict = Depends(get_current_user)) -> ChatService:
    return get_chat_service_for_user(str(current_user["_id"]))


@lru_cache
def get_evaluator():

    return Evaluator()


def refresh_chat_service(user_id: str):
    """
    Drop the cached ChatService for this user so it's rebuilt (with the
    freshly-updated vectorstore) on their next chat request.
    """
    _chat_services.pop(user_id, None)


def knowledge_base_ready(user_id: str) -> bool:
    return get_document_service_for_user(user_id).vectorstore is not None


_latest_evaluation_by_user: dict[str, object] = {}


def set_latest_evaluation(user_id: str, evaluation):
    _latest_evaluation_by_user[user_id] = evaluation


def get_latest_evaluation(user_id: str):
    return _latest_evaluation_by_user.get(user_id)