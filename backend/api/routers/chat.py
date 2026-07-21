import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from api.deps import (
    get_chat_service_for_user,
    get_current_user,
    get_evaluator,
    knowledge_base_ready,
    set_latest_evaluation,
)
from core.config import settings
from db.chat_history import (
    count_conversations,
    count_user_messages,
    create_conversation,
    get_conversation_for_user,
    save_message,
    touch_conversation,
)
from schemas.chat import ChatRequest

router = APIRouter(tags=["chat"])


def _event(payload: dict) -> str:
    return json.dumps(payload, default=str) + "\n"


def _real_stream(chat_service, message: str, user_id, conversation_id):

    evaluator = get_evaluator()

    # Persist the user's message right away.
    save_message(conversation_id, user_id, "user", message)

    result = chat_service.ask(message, session_id=str(conversation_id))

    evaluation = evaluator.evaluate(
        question=result.question,
        context=result.context,
        answer=result.answer.answer,
    )
    set_latest_evaluation(str(user_id), evaluation)

    sources = [
        {
            **doc.metadata,
            "snippet": doc.page_content[:200],
        }
        for doc in result.retrieved_docs
    ]
    evaluation_dict = {
        "retrieval_score": evaluation.retrieval_score,
        "answer_score": evaluation.answer_score,
        "overall_score": evaluation.overall_score,
        "grounded": evaluation.grounded,
        "feedback": evaluation.feedback,
    }

    # Persist the assistant's reply once it is fully generated.
    save_message(
        conversation_id,
        user_id,
        "assistant",
        result.answer.answer,
        sources=sources,
        evaluation=evaluation_dict,
    )
    touch_conversation(conversation_id, title=message)

    # Conversation id first, so the frontend can adopt it for new chats.
    yield _event({"type": "conversation", "conversation_id": str(conversation_id)})

    # Answer
    yield _event(
        {
            "type": "answer",
            "content": result.answer.answer,
        }
    )

    # Summary
    yield _event(
        {
            "type": "summary",
            "summary": result.answer.summary,
        }
    )

    # Key Points
    yield _event(
        {
            "type": "key_points",
            "key_points": result.answer.key_points,
        }
    )

    # Confidence
    yield _event(
        {
            "type": "confidence",
            "confidence": result.answer.confidence,
        }
    )

    # Sources
    yield _event(
        {
            "type": "sources",
            "sources": sources,
        }
    )

    # Evaluation
    yield _event(
        {
            "type": "evaluation",
            "evaluation": evaluation_dict,
        }
    )

    yield _event({"type": "done"})


@router.post("/chat")
def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):

    user_id = current_user["_id"]

    if not knowledge_base_ready(str(user_id)):
        raise HTTPException(
            status_code=409,
            detail="Upload at least one document to build your knowledge base before starting a chat.",
        )

    try:
        chat_service = get_chat_service_for_user(str(user_id))
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if request.conversation_id:
        conversation = get_conversation_for_user(request.conversation_id, user_id)
        if count_user_messages(conversation["_id"]) >= settings.max_messages_per_conversation:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"This chat has reached its {settings.max_messages_per_conversation}-message "
                    "limit. Start a new chat to continue."
                ),
            )
    else:
        if count_conversations(user_id) >= settings.max_conversations_per_user:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"You've reached the limit of {settings.max_conversations_per_user} chats. "
                    "Delete an existing chat to start a new one."
                ),
            )
        conversation = create_conversation(user_id, request.message)

    def generate():
        yield from _real_stream(chat_service, request.message, user_id, conversation["_id"])

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
    )
