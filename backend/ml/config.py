from core.config import BACKEND_ROOT, settings

# ----------------------------------------------------
# Project Paths
# ----------------------------------------------------

PROJECT_ROOT = BACKEND_ROOT
DATA_DIR = settings.data_dir
RAW_DATA_DIR = settings.raw_data_dir
VECTOR_DB_DIR = settings.vector_db_dir
LOG_DIR = settings.log_dir

# ----------------------------------------------------
# Models
# ----------------------------------------------------

EMBEDDING_MODEL = settings.default_embedding_model
CHAT_MODEL = settings.default_llm
HF_CHAT_MODEL = settings.hf_chat_model
HF_EMBEDDING_MODEL = settings.hf_embedding_model

# ----------------------------------------------------
# Text Splitter
# ----------------------------------------------------

CHUNK_SIZE = settings.chunk_size
CHUNK_OVERLAP = settings.chunk_overlap

# ----------------------------------------------------
# Retriever
# ----------------------------------------------------

SEARCH_TYPE = settings.default_retriever
TOP_K = settings.default_top_k
SCORE_THRESHOLD = settings.score_threshold
FETCH_K = settings.fetch_k
