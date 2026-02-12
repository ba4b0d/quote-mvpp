# quote-mvpp v2 🆕

**Modern 3D Printing Quotation System** - Built from scratch with better architecture, accurate estimation, and beautiful UI.

![version](https://img.shields.io/badge/version-2.0.0-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🎯 What's New in v2

| Feature | v1 (Old) | v2 (New) |
|---------|----------|----------|
| **Backend** | Basic Flask | FastAPI + Services Layer |
| **Database** | JSON Files | SQLite + SQLAlchemy |
| **3D Analysis** | Basic | trimesh + Accurate Algorithm |
| **Frontend** | Plain React | React + Vite + TypeScript |
| **Styling** | Basic CSS | Modern Dark Theme |
| **Auth** | Basic | JWT + bcrypt |
| **Admin Panel** | Simple | Full Dashboard |
| **3D Preview** | None | Three.js @react-three/fiber |
| **Docker** | ❌ | ✅ Ready |

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build -d
```

### Option 2: Local Development

```bash
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

### Option 3: Server Deployment

```bash
# Clone and run deployment script
git clone https://github.com/ba4b0d/quote-mvpp.git
cd quote-mvpp

# Configure
cp .env.example .env
nano .env

# Deploy
chmod +x deploy.sh
./deploy.sh
```

**Access:**
- Frontend: http://localhost:5173
- Quote Page: http://localhost:5173/quote
- Admin Panel: http://localhost:5173/admin
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Default Login:** `admin` / `admin123`

## 📁 Project Structure

```
quote-mvpp/
├── deploy.sh              # Server deployment script
├── quick-fix.sh           # Quick fix for existing servers
├── .env.example           # Configuration template
├── docker-compose.yml
├── Dockerfile
│
├── backend/               # FastAPI Backend
│   ├── app/
│   │   ├── main.py       # FastAPI app entry point
│   │   ├── api/v1/        # API endpoints
│   │   ├── core/          # Config, database, security
│   │   └── services/     # Estimation, mesh analysis, pricing
│   └── requirements.txt
│
└── frontend/              # React + Vite Frontend
    ├── src/
    │   ├── pages/         # Home, Quote, Admin, Login
    │   ├── components/   # ModelViewer, Layout, etc.
    │   ├── hooks/         # useAuth, useQuoteStore
    │   └── styles/        # Modern dark theme
    └── package.json
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/quote/estimate` | Upload file → quote |
| POST | `/api/v1/quote/manual` | Manual input → quote |
| GET | `/api/v1/quote/calculate` | Calculate from parameters |
| GET | `/api/v1/materials` | List materials |
| POST | `/api/v1/auth/login` | Staff login |

## 🛠️ Development

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test
```

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Author

**Barbod Marzban**

Built with ❤️ and 🦖 (Raya the AI assistant)

---

## 🙏 Credits

- [trimesh](https://github.com/mikedh/trimesh) - 3D mesh processing
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Three.js](https://threejs.org/) - 3D graphics
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
