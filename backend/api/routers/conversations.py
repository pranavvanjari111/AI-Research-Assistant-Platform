from fastapi import APIRouter, Depends

from api.deps import get_current_user
from core.config import settings
from db.chat_history import (
    count_conversations,
    count_user_messages,
    delete_conversation,
    list_conversations,
    list_messages,
)
from schemas.chat import ConversationOut, LimitsOut, MessageOut

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _serialize_conversation(doc: dict) -> ConversationOut:
    return ConversationOut(
        id=str(doc["_id"]),
        title=doc.get("title") or "New chat",
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        message_count=count_user_messages(doc["_id"]),
    )


def _serialize_message(doc: dict) -> MessageOut:
    return MessageOut(
        id=str(doc["_id"]),
        role=doc["role"],
        content=doc["content"],
        sources=doc.get("sources") or [],
        evaluation=doc.get("evaluation"),
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[ConversationOut])
def get_conversations(current_user: dict = Depends(get_current_user)):
    docs = list_conversations(current_user["_id"])
    return [_serialize_conversation(d) for d in docs]


@router.get("/limits", response_model=LimitsOut)
def get_limits(current_user: dict = Depends(get_current_user)):
    return LimitsOut(
        max_conversations=settings.max_conversations_per_user,
        max_messages_per_conversation=settings.max_messages_per_conversation,
        conversations_used=count_conversations(current_user["_id"]),
    )


@router.get("/{conversation_id}/messages", response_model=list[MessageOut])
def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    docs = list_messages(conversation_id, current_user["_id"])
    return [_serialize_message(d) for d in docs]


@router.delete("/{conversation_id}", status_code=204)
def remove_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    delete_conversation(conversation_id, current_user["_id"])
    return None
