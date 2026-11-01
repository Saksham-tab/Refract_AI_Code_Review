# Refract — AI Code Review

A React code-review workspace based on the supplied Refract HTML prototype, paired with a Python FastAPI backend and a local Ollama Qwen model.

## What is included

- Dark, responsive Refract interface with the original review-workbench direction.
- Monaco code editor, loaded on demand, with language selection, file upload, paste/clear actions, and line navigation from findings.
- Review focus presets: balanced, security, performance, and correctness.
- Severity-filtered findings with expandable explanations, remediation guidance, and source-line references.
- Framer Motion transitions and micro-interactions, plus reduced-motion support.
- Lazy-loaded history screen and Recharts activity/severity analytics.
- FastAPI backend with a local Ollama chat-completion integration.
- Qwen 2.5 Coder 1.5B default model for lightweight local review.
- SQLite persistence for saved review history.

> **Backend note:** only the HTML template was attached in this conversation. No pre-existing Python backend or project archive was available to wire in. The included FastAPI service is therefore a working integration scaffold with a documented API contract; it can be merged with an existing backend when that source is supplied.

## Requirements

- Node.js 18.18+ (Node 20 LTS recommended)
- Python 3.10+
- Ollama installed and available on the local machine

## Run locally

### 1. Configure the Python API

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

macOS / Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Install the local model and start Ollama:

```bash
ollama pull qwen2.5-coder:1.5b
ollama serve
```

The backend defaults to `http://127.0.0.1:11434` and `qwen2.5-coder:1.5b`. These can be changed in `backend/.env` with `OLLAMA_URL` and `OLLAMA_MODEL`.

Start the API from the `backend` directory:

```bash
python run.py
```

API docs: http://127.0.0.1:8000/docs
Health check: http://127.0.0.1:8000/api/health

### 2. Run the React frontend

In a second terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

The Vite development server proxies `/api` to `http://127.0.0.1:8000`. For a different backend origin, create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Build the frontend

```bash
cd frontend
npm run build
npm run preview
```

## API contract

### `GET /api/health`

Returns service status, whether Ollama is reachable, and the active local model ID. It does not run an inference request.

### `POST /api/reviews`

Request:

```json
{
  "code": "def example():\\n    return True",
  "filename": "example.py",
  "language": "python",
  "focus": "balanced"
}
```

`focus` accepts `balanced`, `security`, `performance`, or `correctness`. The response contains the original code, structured summary, findings, and metrics. Finding line numbers are 1-based and are clamped to the submitted source range by the API.

### `GET /api/reviews`

Returns the latest 100 saved reviews without source code and detailed findings. This keeps the history list response small.

### `GET /api/reviews/{review_id}`

Returns the complete stored review, including code and findings.

## Data and security notes

- Source code is sent only to the local Ollama service configured by the backend. It is not sent to a hosted inference provider.
- Reviews are stored locally in `backend/data/refract.db`. The SQLite file is ignored by Git.
- This is a local single-user starter, not a production multi-tenant review service. Add authentication, authorization, request quotas, audit logging, and retention controls before exposing it to a network.
- LLM findings are review suggestions, not proof of exploitability or a substitute for tests, static analysis, or human review.
- The API caps source input at 60,000 characters and uploaded files at 250 KB in the UI.

## Tests

From `backend` with the virtual environment activated:

```bash
python -m unittest discover -s tests -v
```
