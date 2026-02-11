# quote-mvpp v2 🆕

**Modern 3D Printing Quotation System** - Built from scratch with better architecture.

## What's New

### 🎯 Phase 1: Backend (FastAPI + SQLAlchemy)

```
backend/
├── app/
│   ├── api/           # API endpoints
│   │   ├── v1/
│   │   │   ├── quote.py
│   │   │   ├── materials.py
│   │   │   ├── auth.py
│   │   │   └── admin.py
│   │   └── deps.py    # Dependencies
│   │
│   ├── core/          # Core settings
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   │
│   ├── models/        # SQLAlchemy models
│   │   ├── user.py
│   │   ├── quote.py
│   │   └── material.py
│   │
│   ├── schemas/       # Pydantic schemas
│   │   ├── quote.py
│   │   └── user.py
│   │
│   └── services/      # Business logic
│       ├── estimation.py
│       ├── mesh_analysis.py
│       └── pricing.py
│
├── tests/             # Test suite
└── requirements.txt
```

### 🎨 Phase 2: Frontend (React + Tailwind)

```
frontend/
├── src/
│   ├── components/    # Reusable UI
│   │   ├── ui/
│   │   ├── 3d/
│   │   └── forms/
│   │
│   ├── pages/         # Page components
│   │   ├── Home.pyx
│   │   ├── Quote.pyx
│   │   ├── History.pyx
│   │   └── Admin.pyx
│   │
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Helpers
│   └── styles/        # Tailwind config
│
└── package.json
```

## Quick Start (Coming Soon)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Documentation

- [Estimation Algorithm](./docs/ESTIMATION_ALGORITHM.md) - How accurate quotes work
- [API Documentation](./docs/API.md) - Endpoint reference
- [Database Schema](./docs/SCHEMA.md) - SQLAlchemy models

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI + Python 3.11 |
| **Database** | SQLAlchemy + SQLite/PostgreSQL |
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **3D** | Three.js + @react-three/fiber |
| **Auth** | JWT + bcrypt |

## License

MIT
