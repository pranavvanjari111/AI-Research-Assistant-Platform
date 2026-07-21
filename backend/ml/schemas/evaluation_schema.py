from pydantic import BaseModel


class EvaluationSchema(BaseModel):

    retrieval_score: float

    answer_score: float

    grounded: bool

    overall_score: float

    feedback: str