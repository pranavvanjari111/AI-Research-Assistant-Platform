from ml.models.chat_model import get_chat_model

from ml.prompts.evaluation_prompt import EVALUATION_PROMPT

from ml.schemas.evaluation_schema import EvaluationSchema


class Evaluator:

    def __init__(self):

        self.llm = (
            get_chat_model()
            .with_structured_output(
                EvaluationSchema
            )
        )

        self.chain = (
            EVALUATION_PROMPT
            | self.llm
        )

    def evaluate(
        self,
        question,
        context,
        answer,
    ):

        return self.chain.invoke(
            {
                "question": question,
                "context": context,
                "answer": answer,
            }
        )