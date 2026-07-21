from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder
)

QA_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an AI Research Assistant.
Answer ONLY using the provided context.
If the answer is not available,
say you don't know.
"""
        ),
        MessagesPlaceholder(
            variable_name="history"
        ),
        (
            "human",
            """
Context:
{context}
Question:
{question}
"""
        ),
    ]
)