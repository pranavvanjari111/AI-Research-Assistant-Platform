"""
MongoDB Atlas connection.

Reads MONGODB_URI (and optionally MONGODB_DB_NAME) from the environment /
backend/.env file. The client is created lazily and cached so the app can
still start up even if the URI hasn't been provided yet -- routes that need
the database will raise a clear error instead of crashing on import.
"""

from functools import lru_cache

from fastapi import HTTPException
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError

from core.config import settings


@lru_cache
def get_mongo_client() -> MongoClient:
    if not settings.mongodb_uri:
        raise HTTPException(
            status_code=503,
            detail=(
                "MONGODB_URI is not configured. Add it to backend/.env "
                '(e.g. MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/").'
            ),
        )
    return MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=8000)


@lru_cache
def get_database() -> Database:
    client = get_mongo_client()
    return client[settings.mongodb_db_name]


def get_users_collection() -> Collection:
    db = get_database()
    return db["users"]


def get_conversations_collection() -> Collection:
    db = get_database()
    return db["conversations"]


def get_messages_collection() -> Collection:
    db = get_database()
    return db["messages"]


def ensure_indexes() -> None:
    """Create the indexes the app relies on. Safe to call repeatedly."""
    try:
        users = get_users_collection()
        users.create_index("email", unique=True)

        conversations = get_conversations_collection()
        conversations.create_index([("user_id", 1), ("updated_at", -1)])

        messages = get_messages_collection()
        messages.create_index([("conversation_id", 1), ("created_at", 1)])
        messages.create_index([("user_id", 1)])
    except PyMongoError as exc:
        print(f"WARNING: could not verify MongoDB indexes: {exc}")


def mongo_configured() -> bool:
    return bool(settings.mongodb_uri and settings.mongodb_uri.strip())
