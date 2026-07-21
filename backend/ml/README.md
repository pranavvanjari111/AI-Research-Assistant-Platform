# ml/ — existing ML / RAG implementation goes here

This folder is intentionally a placeholder. The FastAPI layer in
`backend/api/` imports from here and **does not** implement any AI logic
itself — chunking, embedding, retrieval, generation, and evaluation all
belong to your existing codebase.

## Existing ML contract

Copy your existing folders directly into `backend/ml/`, replacing the
placeholders:

```
backend/ml/
├── services/         # DocumentService, ChatService, Evaluator
├── chains/           # LangChain chains
├── retrievers/       # Retrievers (incl. compression retriever)
├── vectorstores/      # FAISS vector store setup
├── evaluation/        # Evaluation logic
├── models/             # Pydantic / dataclass models used internally
├── utils/              # Chunking, parsing, misc helpers
└── config.py           # Your existing ML configuration
```

The API layer expects the following interfaces. **Do not change their
external behavior** — the routers call these directly:

### `services.document_service.DocumentService`
- `ingest(file_path: str, filename: str) -> DocumentRecord`
  Reads a file, chunks it, embeds the chunks, and writes them into the
  FAISS vector store. Should update status through
  `uploading -> chunking -> embedding -> ready` (or `error`).
- `list_documents() -> list[DocumentRecord]`
- `list_chunks(document_id: str | None) -> list[ChunkRecord]`

### `services.chat_service.ChatService`
- `stream(message: str, conversation_id: str | None, config: dict) -> Iterator[ChatEvent]`
  Runs retrieval (via the configured retriever) + generation (via the
  configured LangChain chain) and yields incremental tokens, followed
  by a `sources` event and, if evaluation is enabled, an `evaluation`
  event.

### `evaluation.evaluator.Evaluator`
- `score(question: str, answer: str, retrieved_context: list[str]) -> EvaluationScores`
  Returns retrieval / answer / overall scores, a groundedness flag, and
  optional feedback text.

## Import path

The routers import like this — keep these module paths stable, or
update the imports in `backend/api/routers/`:

```python
from ml.services.document_service import DocumentService
from ml.services.chat_service import ChatService
from ml.evaluation.evaluator import Evaluator
```

Until real implementations are pasted in, the API layer falls back to
lightweight demo behavior so the frontend remains fully explorable.
