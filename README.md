# CVIQ - AI-Powered CV Intelligence Platform

An AI-powered CV review platform that analyses your resume against a real job description and returns structured, actionable feedback. Built with a RAG pipeline, semantic search, a self-improving research agent, and GPT-4o to give feedback grounded in real hiring criteria, not generic advice.

[![CI](https://github.com/CVIQ-Labs/CVIQ-Intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/CVIQ-Labs/CVIQ-Intelligence/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat&logo=openai&logoColor=white)
![Claude](https://img.shields.io/badge/Anthropic-Claude_Haiku-D97706?style=flat)
![Docker](https://img.shields.io/badge/Docker-Containerised-2496ED?style=flat&logo=docker&logoColor=white)
![Oracle Cloud](https://img.shields.io/badge/Backend-Oracle_Cloud-F80000?style=flat&logo=oracle&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=flat&logo=stripe&logoColor=white)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)
![Azure](https://img.shields.io/badge/Cloud-Azure-0078D4?style=flat&logo=microsoftazure&logoColor=white)
![Langfuse](https://img.shields.io/badge/Observability-Langfuse-F97316?style=flat)
![Ragas](https://img.shields.io/badge/Evaluation-Ragas-6366F1?style=flat)

---

## Live

| | URL |
|---|---|
| **Frontend** | [getcviq.com](https://getcviq.com) |
| **Backend API** | [api.getcviq.com/docs](https://api.getcviq.com/docs) |

---

## What it does

Upload a CV (PDF or DOCX) and paste a job description. The system returns a structured review with scores, keyword gaps, strengths, weaknesses, AI-rewritten bullets, and line-by-line feedback. For roles at companies not yet in the knowledge base, a research agent automatically fetches company-specific context from the web before the review runs.

**Free tier:**
- ATS score and keyword gap analysis
- Recruiter feedback score (0-10)
- Strengths and weaknesses
- Bullet point rewrite suggestions
- Section recommendations

**Pro tier (£15/mo):**
- Everything in Free
- AI-rewritten profile summary
- Line-by-line CV feedback
- Detailed ATS deep analysis
- Ask CVIQ AI chat
- CV preview with inline annotations
- Unlimited reviews

---

## How it works

The system uses a RAG pipeline to ground every piece of feedback in a curated knowledge base. When the knowledge base lacks company-specific context, a research agent fetches it automatically and writes it back for future requests.

```
CV (PDF/DOCX)  +  Job Description (text)
        |
        v
  Text Extraction (pypdf / python-docx)
        |
        v
  Chunking + Embedding (OpenAI text-embedding-3-small)
        |
        v
  Extract company + role from JD (Claude Haiku)
        |
        +-- Company already in KB? --> Metadata-filtered retrieval (company + role)
        |
        +-- Company NOT in KB? --> Research Agent
        |         |
        |         v
        |   Tavily web search (tech stack, culture, interview process)
        |         |
        |         v
        |   Claude Haiku summarises into KB chunks
        |         |
        |         v
        |   Write to ChromaDB (background thread, non-blocking)
        |         |
        |         v
        |   Inject fresh chunks into current review context
        |
        v
  GPT-4o (CV + JD + retrieved context)
        |
        v
  Structured JSON Review
        |
        v
  React Frontend (scores, keywords, strengths, bullet rewrites)
```

![RAG Architecture](images/ragarch.PNG)

**Knowledge base sources loaded into ChromaDB at startup:**
- CV review rubric (7 scoring categories with weighted criteria)
- ATS guidelines (keyword strategy, formatting rules, score thresholds)
- Strong bullet point examples (before/after rewrites with structure rules)
- Role matching criteria (tech stack requirements by role across 7 job families)
- Company-specific research chunks written by the research agent at runtime

---

## Research Agent

The knowledge base holds general CV advice but has no company-specific information out of the box. For a Monzo Data Engineer or a Stripe Backend Engineer role, general advice alone produces a weaker review.

The research agent fills that gap automatically. On every review request, Claude Haiku extracts the company name and role from the job description. If that company/role combination is not in the knowledge base, the agent fires:

1. **Search** - Tavily runs two queries: one for the company's tech stack and role requirements, one for their engineering culture and interview process
2. **Summarise** - Claude Haiku condenses the results into 3-5 structured knowledge base paragraphs
3. **Write** - chunks are embedded and written to ChromaDB in a background thread (non-blocking)
4. **Inject** - fresh chunks are prepended to the review context immediately so the current request benefits straight away

On repeat requests for the same company/role, the search is skipped entirely. Instead, a metadata-filtered query pulls the existing chunks directly rather than relying on cosine similarity to surface them among general KB content.

The first review for a new company/role adds roughly 8-10 seconds. All subsequent reviews for that combination are unaffected.

---

## LLMOps

The pipeline is instrumented end-to-end with production-grade observability, evaluation, and guardrails.

### Observability - Langfuse

Every request is traced in [Langfuse](https://langfuse.com/):

| Span | What is captured |
|---|---|
| **Trace** | CV length, JD length, prompt version - one trace per review request |
| **Retrieval span** | Chunks retrieved, chunks dropped by relevance threshold, distance scores |
| **Generation** | Full prompt sent to GPT, raw response, token usage, estimated cost per call |

### RAG evaluation - Ragas

A [Ragas](https://ragas.io/) evaluation suite runs against a golden dataset of synthetic CV/JD pairs every Monday at 9am UTC via GitHub Actions:

| Metric | What it measures |
|---|---|
| **Faithfulness** | Are review claims grounded in the retrieved knowledge base context? |
| **Answer Relevancy** | Is the feedback relevant to the specific CV and JD submitted? |
| **Context Precision** | Are the retrieved chunks actually useful for generating the answer? |
| **Context Recall** | Does the retrieved context cover everything in the expected answer? |

Run manually:
```bash
cd backend
pip install -r requirements-eval.txt
OPENAI_API_KEY=sk-... python tests/eval/run_eval.py
```

### Prompt versioning

System prompts live as versioned text files (`prompts/system_v1.0.0.txt`) and are loaded at runtime. The active version is set via `PROMPT_VERSION` and attached to every Langfuse trace. Prompt changes can be correlated with score regressions without redeploying.

### Relevance threshold and research trigger

Before any chunks reach the LLM, a cosine distance filter drops retrievals with distance > 0.8. The pipeline also extracts the company and role from the JD on every request (Claude Haiku, ~$0.00004) and fires the research agent if that combination is not yet in the knowledge base. Weak retrieval alone no longer controls the trigger since general KB content can pass the threshold even when company-specific context is missing.

### Token and cost logging

After every GPT call, token usage and estimated cost are logged and attached to the Langfuse generation:

```
[tokens] prompt=1842 completion=312 total=2154 cost=$0.0005
```

### Output gate

The JSON response is scanned for hallucination markers (`"as an ai"`, `"i believe"`, `"i'm not sure"`) before being returned to the frontend. Any trigger is logged and flagged in the response payload for audit.

### PII detection - Microsoft Presidio

Every CV submitted is scanned by [Presidio](https://microsoft.github.io/presidio/) before processing. Detected PII entities (names, emails, phone numbers) are logged for audit with a full record of what personal data was processed.

### Chunk metadata

Every ChromaDB chunk carries a source filename, SHA-256 document hash, chunk index, and ingestion timestamp. Research agent chunks additionally carry company, role, and ingestion timestamp metadata to enable targeted metadata-filtered retrieval and deduplication.

---

## Tech stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [React Router](https://reactrouter.com/) | Client-side routing |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Axios](https://axios-http.com/) | API requests |
| [React Dropzone](https://react-dropzone.js.org/) | Drag and drop file upload |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | Auth client |
| [Stripe JS](https://stripe.com/docs/js) | Embedded checkout |
| [Vercel](https://vercel.com/) | Frontend hosting |

### Backend
| Technology | Purpose |
|---|---|
| [FastAPI 0.136](https://fastapi.tiangolo.com/) | API framework |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |
| [Pydantic v2](https://docs.pydantic.dev/) | Request/response validation |
| [pypdf](https://pypdf.readthedocs.io/) | PDF text extraction |
| [python-docx](https://python-docx.readthedocs.io/) | DOCX text extraction |
| [python-multipart](https://multipart.fastapiexpert.com/) | File upload handling |
| [Supabase Python](https://supabase.com/docs/reference/python) | Auth verification and user management |
| [Stripe Python](https://stripe.com/docs/api?lang=python) | Subscription billing |
| [Resend](https://resend.com/) | Transactional email (waitlist confirmations) |

### AI and NLP
| Technology | Purpose |
|---|---|
| [OpenAI GPT-4o](https://platform.openai.com/docs/models) | Review generation |
| [OpenAI text-embedding-3-small](https://platform.openai.com/docs/guides/embeddings) | Semantic embeddings |
| [Claude Haiku](https://www.anthropic.com/claude) | Company/role extraction and research summarisation |
| [Tavily](https://tavily.com/) | Web search for the research agent |
| [ChromaDB](https://www.trychroma.com/) | Local vector store |
| [Langfuse](https://langfuse.com/) | LLM observability |
| [Ragas](https://ragas.io/) | RAG evaluation |
| [Microsoft Presidio](https://microsoft.github.io/presidio/) | PII detection and audit logging |

### Infrastructure
| Technology | Purpose |
|---|---|
| [Docker](https://www.docker.com/) | Containerisation |
| [Oracle Cloud A1 Flex](https://www.oracle.com/cloud/compute/arm/) | Backend hosting (2 OCPU / 12GB RAM, ARM, always-on free tier) |
| [Caddy](https://caddyserver.com/) | Reverse proxy and automatic HTTPS |
| [Supabase](https://supabase.com/) | Auth, user profiles, waitlist, RLS |
| [Stripe](https://stripe.com/) | Subscription billing and webhooks |
| [Vercel](https://vercel.com/) | Frontend hosting |
| [Terraform](https://www.terraform.io/) | Azure infrastructure as code (AKS, ACR, Key Vault, storage) |
| [Kubernetes](https://kubernetes.io/) | Container orchestration (AKS manifests ready for migration) |
| [Azure](https://azure.microsoft.com/) | Cloud provider for future scaled deployment |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

---

## Architecture

```
Browser (Vercel - getcviq.com)
      |
      | HTTPS (Supabase JWT in Authorization header)
      v
Caddy reverse proxy (api.getcviq.com)
      |
      v
FastAPI Backend (Oracle Cloud A1 Flex - ARM, always-on)
      |
      |-- pypdf / python-docx extracts CV text
      |-- Presidio scans for PII
      |-- Claude Haiku extracts company + role from JD
      |-- Research agent fetches and writes company context if missing
      |-- ChromaDB retrieves knowledge base chunks (metadata-filtered or cosine)
      |-- GPT-4o generates structured review
      |-- Supabase verifies JWT and checks Pro tier
      |
      v
JSON response back to frontend

Stripe webhooks --> /stripe/webhook --> Supabase user_profiles (is_pro, subscription_id)
Research agent --> Tavily search --> Claude Haiku --> ChromaDB (background thread)
```

The frontend and backend are deployed independently. The React app on Vercel calls the FastAPI backend on Oracle Cloud directly from the browser. Authentication is handled by Supabase. The frontend passes a JWT with every request, the backend verifies it and gates Pro features accordingly.

---

## Security

Security was treated as a first-class concern throughout the build, not something added at the end.

### Dependency and code scanning (CI gates)

Every push to `main` runs three automated security checks that block deployment on critical/high findings.

| Tool | What it scans | Threshold |
|---|---|---|
| [Bandit](https://bandit.readthedocs.io/) | Python source code - injection, hardcoded secrets, unsafe functions | Medium and above |
| [pip-audit](https://pypi.org/project/pip-audit/) | Python dependencies against OSV and PyPI Advisory databases | Any known CVE |
| [Trivy](https://trivy.dev/) | Docker image (OS packages + Python packages) | Critical and High (fixed only) |

### Vulnerability remediation history

- Migrated from `PyPDF2` (deprecated, CVE-2023-36464) to `pypdf` which patches 25+ DoS vulnerabilities in PDF parsing
- Bumped `pypdf` from `6.12.0` to `6.13.3` across three rounds of newly disclosed CVEs
- Bumped `pypdf` from `6.13.3` to `6.14.2` to patch CVE-2026-59935, CVE-2026-59936, CVE-2026-59937, CVE-2026-59938
- Upgraded `python-multipart` to patch path traversal (CVE-2026-24486) and DoS (CVE-2026-40347)
- Upgraded `python-dotenv` to patch symlink file overwrite (CVE-2026-28684)
- Upgraded `FastAPI` to pull in `starlette 1.2.1`, patching DoS via malformed Range headers (CVE-2025-62727)
- Upgraded `setuptools` to patch CVE PYSEC-2026-3447

### Secrets management

- `.env` is in `.gitignore`, never committed
- `.env.example` documents required variable names without values
- On the server, secrets are injected via `~/app.env`, never baked into the image
- `CORS_ORIGINS` is a comma-separated env var parsed at runtime, no hardcoded origins in code

---

## API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Health check |
| `POST` | `/upload` | Optional | Parse a CV file and return extracted text |
| `POST` | `/review` | Required | Full AI review - scores, keywords, strengths, weaknesses, bullet rewrites |
| `POST` | `/create-checkout-session` | Optional | Create a Stripe embedded checkout session |
| `GET` | `/session-status` | None | Get Stripe checkout session status |
| `POST` | `/stripe/webhook` | Stripe signature | Handle subscription lifecycle events |
| `DELETE` | `/account` | Required | Cancel subscription and delete auth user |
| `POST` | `/chat` | Required (Pro) | AI chat against CV and job description |
| `POST` | `/ats-preview` | Required | Detailed ATS breakdown |
| `GET` | `/testimonials` | None | Fetch testimonials |
| `POST` | `/waitlist` | None | Join the waitlist - stores email in Supabase and sends confirmation via Resend |

Full interactive documentation: [api.getcviq.com/docs](https://api.getcviq.com/docs)

---

## Running locally

**Requirements:** Python 3.11, Node.js 18+, an OpenAI API key

### Backend

```bash
git clone https://github.com/CVIQ-Labs/CVIQ-Intelligence.git
cd CVIQ-Intelligence/backend

python -m venv .venv
source .venv/Scripts/activate  # Windows
# or: source .venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python -c "from spacy.cli import download; download('en_core_web_sm')"

cp .env.example .env
# Fill in your OPENAI_API_KEY and other vars in .env

uvicorn app.main:app --reload
```

Backend available at `http://localhost:8000`.

### Frontend

```bash
cd CVIQ-Intelligence/frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

**Running with Docker:**
```bash
cd CVIQ-Intelligence
docker-compose up --build
```

**Running tests:**
```bash
cd backend
pytest tests/ -v
```

---

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push / PR to `main` | Run tests, Bandit, pip-audit, Docker build, Trivy scan, deploy to Oracle Cloud |
| `eval.yml` | Monday 9am UTC | Ragas RAG evaluation against golden dataset |
| `aks-provision.yml` | Manual only | Bootstrap Terraform state storage, run `terraform apply` on Azure AKS |
| `aks-cd.yml` | Manual only | Build `linux/amd64` image, push to ACR, deploy to AKS |
| `aks-destroy.yml` | Manual (`confirm: DESTROY`) | Tear down all Azure resources |

The AKS workflows are manual-only and will not trigger automatically. They are ready for when the product migrates to Azure.

---

## Project structure

```
CVIQ-Intelligence/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (health, upload, review, auth, stripe, account, chat, ats_preview, waitlist)
│   │   ├── core/           # Config, auth, exceptions
│   │   ├── ingestion/      # PDF/DOCX parsing, text loading, chunking
│   │   ├── embeddings/     # OpenAI embedding wrapper
│   │   ├── vectorstore/    # ChromaDB integration
│   │   ├── rag/            # Pipeline, retriever, generator, prompts
│   │   ├── research/       # Research agent (extractor, Tavily search, Haiku summariser, KB writer)
│   │   ├── review/         # Rubric weights, scorer/validator, CV builder
│   │   └── Models/         # Pydantic response models
│   ├── knowledge_base/     # CV rubric, ATS guidelines, bullet examples, role criteria
│   ├── prompts/            # Versioned system prompt files (system_v1.0.0.txt)
│   ├── tests/
│   │   ├── test_api.py     # FastAPI endpoint tests
│   │   ├── test_rag.py     # Chunker, loader, scorer unit tests
│   │   └── eval/           # Ragas evaluation suite + golden dataset
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements-eval.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client
│   │   ├── components/     # ScoreCards, KeywordList, BulletRewrites, ResultPanel, CVModal
│   │   ├── pages/          # Home, Upload, Results, Pricing, Login, Signup, Return, Settings
│   │   ├── utils/          # useAuth hook, supabase client, animations
│   │   └── styles/         # CSS per page
│   ├── vercel.json         # SPA routing rewrite rule
│   ├── index.html
│   └── package.json
├── terraform/              # Azure AKS, ACR, Key Vault, Log Analytics (IaC)
├── k8s/                    # Kubernetes manifests (namespace, deployment, service, storage, secrets)
├── docker-compose.yml
└── .github/workflows/
    ├── ci.yml              # Test, security scan, deploy to Oracle Cloud on push to main
    ├── eval.yml            # Scheduled Ragas evaluation (Mondays 9am UTC)
    ├── aks-provision.yml   # Manual - Terraform apply on Azure
    ├── aks-cd.yml          # Manual - Build and deploy to AKS
    └── aks-destroy.yml     # Manual - Tear down Azure resources
```

---

## Roadmap

- [x] User accounts and auth (Supabase)
- [x] Pro tier with Stripe subscription billing
- [x] Stripe webhook subscription lifecycle handling
- [x] Pro feature gating (bullet rewrites, line feedback, ATS deep, AI chat)
- [x] Custom domain (getcviq.com)
- [x] Account deletion endpoint (GDPR)
- [x] Resend transactional email (waitlist confirmations, bypasses Supabase rate limit)
- [x] Research agent (Tavily + Claude Haiku, company/role-scoped KB cache, metadata retrieval)
- [x] Waitlist endpoint with Supabase storage and email confirmation
- [ ] Settings page with account management (frontend)
- [ ] Prometheus metrics endpoint (`/metrics`) - request latency, score distributions, error rates
- [ ] Grafana dashboard - visualise metrics from Prometheus
- [ ] Migrate research agent to MCP-based agentic tool use (depending on production results)
- [ ] Migrate to Azure AKS when funded (Terraform + Kubernetes manifests already in place)

---

## Team

Built by [Seyi Bello](https://github.com/seyiabello), [Jamie Moore-Arthur](https://github.com/jamiemoorearthur), [Rochelle Smith](https://github.com/rochellejjsmith), and Sade Smith.

- **Seyi** - Co-Founder and Lead AI Platform Engineer. Built the full AI platform including the RAG pipeline, research agent, embeddings, vector store, review logic, and all API endpoints. Also built and owns the entire infrastructure from scratch including Docker containerisation, Terraform IaC, Kubernetes manifests, Oracle Cloud deployment, Caddy reverse proxy, GitHub Actions CI/CD, and all security scanning.
- **Jamie** - Founder and CEO. Knowledge base content, ingestion pipeline, file upload, infrastructure support, DNS and domain management
- **Rochelle** - Head of UI/UX and Front-End Engineering. Frontend: React UI, component design, upload flow, results display, design system, Vercel deployment
- **Sade** -Head of UI/UX and Front-End Engineering. Frontend: React UI, component design, upload flow, results display
