# quote-mvpp v2 🆕

**Modern 3D Printing Quotation System** - Built from scratch with better architecture, accurate estimation, and beautiful UI.

![quote-mvpp v2](https://img.shields.io/badge/version-2.0.0-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-red)

## 🎯 What's New in v2

| Feature | v1 (Old) | v2 (New) |
|---------|----------|----------|
| **Backend** | Basic Flask | FastAPI + Services Layer |
| **Database** | JSON Files | SQLite + SQLAlchemy |
| **3D Analysis** | Basic | trimesh + Accurate Algorithm |
| **Frontend** | Plain React | React + Vite + TypeScript |
| **Styling** | Basic CSS | Modern Dark Theme + Tailwind |
| **Auth** | Basic | JWT + bcrypt |
| **Admin Panel** | Simple | Full Dashboard |
| **3D Preview** | None | Three.js @react-three/fiber |

## 🚀 Quick Start

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/ba4b0d/quote-mvpp.git
cd quote-mvpp

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Quote Page: http://localhost:5173/quote
- Admin Panel: http://localhost:5173/admin
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Default Login:** `admin` / `admin123`

### Option 2: Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run individually
docker build -t quote-mvpp .
docker run -p 8000:8000 -p 5173:5173 quote-mvpp
```

## 📁 Project Structure

```
quote-mvpp/
├── 📄 README.md
├── 📄 DOCKER_README.md
├── 📄 docker-compose.yml
├── 📄 Dockerfile
├── 📄 Dockerfile.frontend-dev
│
├── 📁 backend/                 # FastAPI Backend
│   ├── 📄 requirements.txt
│   └── 📁 app/
│       ├── 📄 main.py          # FastAPI app entry point
│       ├── 📁 api/v1/
│       │   ├── 📄 quote.py     # Quote endpoints
│       │   ├── 📄 auth.py      # JWT authentication
│       │   └── 📄 materials.py # Materials & settings
│       ├── 📁 core/
│       │   ├── 📄 config.py    # Settings (Pydantic)
│       │   ├── 📄 database.py  # SQLite + SQLAlchemy
│       │   └── 📄 security.py  # JWT + bcrypt
│       └── 📁 services/
│           ├── 📄 estimation.py    # Quote logic
│           ├── 📄 mesh_analysis.py # 3D file analysis (trimesh)
│           └── 📄 pricing.py       # Cost calculations
│
└── 📁 frontend/                # React + Vite Frontend
    ├── 📄 package.json
    ├── 📄 vite.config.ts
    ├── 📄 index.html
    └── 📁 src/
        ├── 📄 App.tsx
        ├── 📄 main.tsx
        ├── 📁 pages/
        │   ├── 📄 HomePage.tsx      # Landing page
        │   ├── 📄 QuotePage.tsx     # Quote calculator
        │   ├── 📄 AdminPage.tsx     # Admin dashboard
        │   └── 📄 LoginPage.tsx     # Staff login
        ├── 📁 components/
        │   ├── 📄 ModelViewer.tsx   # 3D model preview
        │   ├── 📄 Layout.tsx
        │   └── 📄 LoadingScreen.tsx
        ├── 📁 hooks/
        │   ├── 📄 useAuth.ts        # Auth store (Zustand)
        │   └── 📄 useQuoteStore.ts  # Quote store (Zustand)
        └── 📁 styles/
            └── 📄 globals.css       # Modern dark theme
```

## 📊 Estimation Algorithm

Our accurate 3D printing estimation is documented in [docs/ESTIMATION_ALGORITHM.md](docs/ESTIMATION_ALGORITHM.md)

### Key Calculations

1. **Volume Analysis** - `trimesh.volume` for accurate material needs
2. **Print Time** - Layer-by-layer estimation
3. **Support Material** - Overhang angle detection
4. **Cost Breakdown** - Material + Electricity + Labor + Overhead + Markup

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI + Python 3.11 |
| **Database** | SQLite + SQLAlchemy |
| **3D Processing** | trimesh + numpy |
| **Authentication** | JWT + bcrypt |
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Custom CSS (no Tailwind dependency) |
| **3D Preview** | Three.js + @react-three/fiber |
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/quote/estimate` | Upload file → quote |
| POST | `/api/v1/quote/manual` | Manual input → quote |
| GET | `/api/v1/quote/calculate` | Calculate from parameters |
| GET | `/api/v1/materials` | List materials |
| GET | `/api/v1/settings` | Get settings |
| POST | `/api/v1/auth/login` | Staff login |
| POST | `/api/v1/auth/verify` | Verify token |

## 🎛️ Admin Panel

- 📋 **Materials** - Add/Edit/Remove materials with prices
- ⚙️ **Settings** - Configure electricity rate, markup, overhead
- 📊 **Analytics** - Quote statistics (coming soon)

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Adding New Materials

Edit `backend/app/core/database.py` in the `seed_materials()` function:

```python
default_materials = [
    {"name": "PLA Black", "price_per_kg": 1650000, "color": "Black"},
    {"name": "Your New Material", "price_per_kg": 2000000, "color": "Blue"},
]
```

### Configuration

Edit `backend/app/core/config.py`:

```python
class Settings(BaseSettings):
    ELECTRICITY_RATE_PER_KWH: int = 812  # IRT
    DEFAULT_OVERHEAD_PCT: float = 0.3
    DEFAULT_MARKUP_PCT: float = 2.0
    COLORING_COST_PER_HOUR: int = 150000  # IRT
```

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Author

**Barbod Marzban** - https://github.com/ba4b0d

Built with ❤️ and 🦖 (Raya the AI assistant)

---

## 🙏 Credits

- [trimesh](https://github.com/mikedh/trimesh) - 3D mesh processing
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Three.js](https://threejs.org/) - 3D graphics
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
