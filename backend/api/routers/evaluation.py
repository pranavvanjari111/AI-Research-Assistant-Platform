from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user, get_latest_evaluation

router = APIRouter(tags=["evaluation"])


@router.get("/evaluation")
def get_evaluation(current_user: dict = Depends(get_current_user)):

    evaluation = get_latest_evaluation(str(current_user["_id"]))

    if evaluation is None:
        raise HTTPException(
            status_code=404,
            detail="No evaluation available.",
        )

    return {
        "retrieval_score": evaluation.retrieval_score,
        "answer_score": evaluation.answer_score,
        "overall_score": evaluation.overall_score,
        "grounded": evaluation.grounded,
        "feedback": evaluation.feedback,
    }
