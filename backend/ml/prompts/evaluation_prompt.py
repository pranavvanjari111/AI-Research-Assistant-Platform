from langchain_core.prompts import ChatPromptTemplate


EVALUATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an AI evaluator.

Evaluate the generated answer.

Score everything honestly.

Only use the provided context.
"""
        ),
        (
            "human",
            """
Question:
{question}

Context:
{context}

Answer:
{answer}

Evaluate:

1. Retrieval Score (0-10)

2. Answer Score (0-10)

3. Is the answer grounded?

4. Overall Score (0-10)

5. Feedback
"""
        )
    ]
)