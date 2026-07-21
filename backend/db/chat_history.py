"""
Data-access helpers for chat conversations and messages stored in
MongoDB Atlas, scoped per authenticated user.
"""

from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from db.mongo import get_conversations_collection, get_messages_collection


def _oid(value: str, field_name: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}.")


def count_conversations(user_id: ObjectId) -> int:
    return get_conversations_collection().count_documents({"user_id": user_id})


def count_user_messages(conversation_id: ObjectId) -> int:
    return get_messages_collection().count_documents(
        {"conversation_id": conversation_id, "role": "user"}
    )


def create_conversation(user_id: ObjectId, title: str) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "title": title[:80] if title else "New chat",
        "created_at": now,
        "updated_at": now,
    }
    result = get_conversations_collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_conversation_for_user(conversation_id: str, user_id: ObjectId) -> dict:
    conv = get_conversations_collection().find_one(
        {"_id": _oid(conversation_id, "conversation_id"), "user_id": user_id}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


def get_or_create_conversation(conversation_id: str | None, user_id: ObjectId, seed_title: str) -> dict:
    if conversation_id:
        return get_conversation_for_user(conversation_id, user_id)
    return create_conversation(user_id, seed_title)


def touch_conversation(conversation_id: ObjectId, title: str | None = None) -> None:
    update: dict = {"updated_at": datetime.now(timezone.utc)}
    if title:
        update["title"] = title[:80]
    get_conversations_collection().update_one({"_id": conversation_id}, {"$set": update})


def list_conversations(user_id: ObjectId) -> list[dict]:
    cursor = (
        get_conversations_collection()
        .find({"user_id": user_id})
        .sort("updated_at", -1)
    )
    return list(cursor)


def delete_conversation(conversation_id: str, user_id: ObjectId) -> None:
    conv_oid = _oid(conversation_id, "conversation_id")
    conv = get_conversations_collection().find_one({"_id": conv_oid, "user_id": user_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    get_messages_collection().delete_many({"conversation_id": conv_oid})
    get_conversations_collection().delete_one({"_id": conv_oid})


def save_message(
    conversation_id: ObjectId,
    user_id: ObjectId,
    role: str,
    content: str,
    sources: list | None = None,
    evaluation: dict | None = None,
) -> dict:
    doc = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "evaluation": evaluation,
        "created_at": datetime.now(timezone.utc),
    }
    result = get_messages_collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def list_messages(conversation_id: str, user_id: ObjectId) -> list[dict]:
    # Ensures the conversation belongs to the requesting user before returning messages.
    get_conversation_for_user(conversation_id, user_id)
    cursor = (
        get_messages_collection()
        .find({"conversation_id": _oid(conversation_id, "conversation_id")})
        .sort("created_at", 1)
    )
    return list(cursor)
