from pydantic import BaseModel, Field


class ResearchAnswer(BaseModel):

    answer: str = Field(
        description="Detailed answer to the user's question."
    )

    summary: str = Field(
        description="One-line summary."
    )

    key_points: list[str] = Field(
        description="Important bullet points."
    )

    confidence: str = Field(
        description="Low, Medium or High confidence."
    )