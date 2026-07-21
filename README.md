# AI Research Assistant

A ChatGPT-style frontend and a thin FastAPI backend for an existing
LangChain / RAG pipeline (FAISS, OpenAI, retrieval, evaluation,
chunking, compression retriever, multi-document support).

This repo **does not reimplement your ML code**. The backend only
exposes it over a REST/streaming API; the frontend only renders it.
Your existing `services/`, `chains/`, `retrievers/`, `vectorstores/`,
`evaluation/`, `models/`, `utils/`, and `config.py` are copied into
`backend/ml/` as-is.

```
├── frontend/     React + TypeScript + Vite + Tailwind + shadcn/ui
├── backend/      FastAPI, thin API layer over backend/ml
│   └── ml/       ← paste your existing RAG implementation here
└── README.md
```

## 1. Install

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## LLM provider: OpenAI or free Hugging Face fallback

You don't need an OpenAI key to run this. `backend/.env` supports
either provider, chosen automatically:

```
# Option A -- OpenAI (paid, best quality)
OPENAI_API_KEY=""

# Option B -- Hugging Face (free)
HUGGINGFACEHUB_API_TOKEN=""
```

- If `OPENAI_API_KEY` is set, it's used for both chat and embeddings.
- Otherwise, if `HUGGINGFACEHUB_API_TOKEN` is set (get one free at
  https://huggingface.co/settings/tokens), chat runs through the
  Hugging Face Inference API (`HF_CHAT_MODEL`, default
  `HuggingFaceH4/zephyr-7b-beta`) — quality is noticeably below
  GPT-4o-mini, and free-tier availability of specific models can
  change, so swap `HF_CHAT_MODEL` if your chosen model isn't served.
- Embeddings **always** fall back to a local `sentence-transformers`
  model (`HF_EMBEDDING_MODEL`, default `all-MiniLM-L6-v2`) when no
  OpenAI key is set — this runs on your own CPU, costs nothing, and
  needs no token, only an internet connection the first time to
  download the model (~90MB, cached after that).
- If neither is set, `/api/upload` and `/api/chat` return a clear 503
  explaining what to add.

Check `GET /api/status` any time to see which provider is active
(`llm_provider`, `embedding_provider`).

## 2. Copy your existing ML code in

Move (or symlink) your existing folders into `backend/ml/`, replacing
the placeholders:

```
backend/ml/
├── services/
├── chains/
├── retrievers/
├── vectorstores/
├── evaluation/
├── models/
├── utils/
└── config.py
```

Then implement three thin entry points your existing code likely
already has equivalents for — see `backend/ml/README.md` for the exact
method signatures expected by the API layer:

- `ml/services/document_service.py` → `DocumentService`
- `ml/services/chat_service.py` → `ChatService`
- `ml/evaluation/evaluator.py` → `Evaluator`

Uncomment the relevant packages (`langchain`, `faiss-cpu`, `openai`,
etc.) in `backend/requirements.txt` and reinstall.

Until you do this, the app still runs end-to-end with lightweight
placeholder responses, so you can build out the frontend independently
of the backend integration.

## 3. Run

Two terminals:

```bash
# Terminal 1 — backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to
`http://localhost:8000`.

## Authentication & chat history (MongoDB Atlas)

The app now requires sign-in, and every user's chat history is
persisted to MongoDB Atlas.

1. Create a free cluster at https://cloud.mongodb.com and grab its
   connection string (Database → Connect → Drivers).
2. Add it to `backend/.env`:

   ```
   MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
   MONGODB_DB_NAME="ai_research_assistant"
   JWT_SECRET_KEY="<a long random string>"
   ```

   A `JWT_SECRET_KEY` has already been generated for you in
   `backend/.env` — rotate it before deploying anywhere shared.
3. Restart the backend. On startup it creates two collections,
   `users` and `conversations`/`messages`, plus the indexes they need
   (unique email, per-user conversation lookups).
4. Open the app — you'll land on a **Sign in / Create account** page
   first. Every chat request after that requires a bearer token, and
   each conversation + message is written to MongoDB as it happens.
   The sidebar's "Recent" list is now read live from Mongo per user.

If `MONGODB_URI` isn't set, `/api/auth/*`, `/api/chat`, and
`/api/conversations/*` respond with `503` until it is configured; the
rest of the app (upload/status/documents) still works.

### Per-user limits

Every account (including demo accounts) is capped at
`max_conversations_per_user` chats (default **2**) and
`max_messages_per_conversation` user messages per chat (default
**3**) — enforced server-side in `POST /api/chat`, not just in the
UI. Change the defaults in `core/config.py` or via env vars
`MAX_CONVERSATIONS_PER_USER` / `MAX_MESSAGES_PER_CONVERSATION`. The
sidebar shows live usage (`X/2` chats, `X/3` per chat) and the chat
input disables itself with an explanation once a limit is hit.

### Demo account

The sign-in page has a **"Try demo account"** button
(`POST /api/auth/demo`) that instantly creates a disposable account
and logs into it — no form, no email. Each click provisions its own
account with its own full quota, so it scales to any number of
people trying it concurrently without them exhausting a single
shared login's limits. Set `DEMO_ACCOUNTS_ENABLED=false` in
`backend/.env` to turn the button/endpoint off (e.g. for a
production deployment). Demo accounts aren't automatically deleted —
periodically clean up `users` where `is_demo: true` in MongoDB if
that matters for your deployment.

## Folder reference

| Path | Purpose |
|---|---|
| `frontend/src/pages/auth/AuthPage.tsx` | Sign in / create account screen |
| `frontend/src/context/AuthContext.tsx` | Session state, login/register/logout |
| `frontend/src/components/layout` | Sidebar (history + user footer), Header |
| `frontend/src/components/chat` | Message list, input, markdown rendering, sources |
| `frontend/src/components/upload` | Upload dialog, knowledge base viewer |
| `frontend/src/components/settings` | LLM / retriever / top-k / temperature configuration |
| `frontend/src/components/developer` | Slide-over: documents, chunks, retrieved context, prompt, evaluation, debug |
| `frontend/src/api/client.ts` | All backend calls, incl. NDJSON chat streaming + auth |
| `backend/api/routers` | `/auth`, `/chat`, `/conversations`, `/upload`, `/status`, `/documents`, `/chunks`, `/evaluation` |
| `backend/core/config.py` | App settings (CORS, upload limits, Mongo, JWT, defaults) |
| `backend/core/security.py` | Password hashing + JWT issue/verify |
| `backend/db/mongo.py` | MongoDB Atlas client + collections + indexes |
| `backend/db/chat_history.py` | Conversation/message persistence helpers |
| `backend/ml` | **Your existing RAG implementation goes here** |

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account, returns a JWT |
| POST | `/api/auth/login` | – | Exchange email/password for a JWT |
| POST | `/api/auth/demo` | – | Instantly provisions a fresh, disposable demo account and returns a JWT for it (no form to fill in) |
| GET | `/api/auth/me` | ✅ | Current user profile |
| POST | `/api/chat` | ✅ | Streams an assistant reply as newline-delimited JSON (`conversation`, `answer`, `sources`, `evaluation`, `done` events) and persists both sides of the exchange to MongoDB |
| GET | `/api/conversations` | ✅ | List the current user's conversations, most recently updated first |
| GET | `/api/conversations/{id}/messages` | ✅ | Full message history for one conversation |
| DELETE | `/api/conversations/{id}` | ✅ | Delete a conversation and its messages |
| POST | `/api/upload` | – | Upload a pdf/docx/txt/md file for ingestion |
| GET | `/api/status` | – | Health check + whether `ml/` and MongoDB are wired up |
| GET | `/api/documents` | – | List indexed documents |
| GET | `/api/chunks?document_id=` | – | List chunks, optionally filtered by document |
| GET | `/api/evaluation?message_id=` | – | Retrieval/answer/overall scores for a message |

Authenticated routes expect `Authorization: Bearer <token>`; the
frontend attaches this automatically once you're signed in.

## Design tokens

Background `#F8FAFC` · Sidebar `#FFFFFF` · Border `#E5E7EB` · Primary `#2563EB` · Text `#111827` · Secondary `#6B7280` · Font: Inter
