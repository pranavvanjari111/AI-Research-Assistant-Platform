from ml.prompts.qa_prompt import QA_PROMPT
from ml.models.chat_model import get_chat_model

def ask_question(retriever, question):
    docs = retriever.invoke(question)
    context = "\n\n".join(
        doc.page_content for doc in docs
    )

    prompt = QA_PROMPT.invoke({
        'context': context,
        'question': question,
    })

    llm = get_chat_model()
    response = llm.invoke(prompt)

    return response.content