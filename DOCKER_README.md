# quote-mvpp v2 - Docker Setup

## Quick Start with Docker

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Manual Docker Commands

```bash
# Build the image
docker build -t quote-mvpp .

# Run the container
docker run -p 8000:8000 -p 5173:5173 quote-mvpp
```

## Development

The Docker setup uses volumes for hot-reloading:
- Backend changes auto-reload via uvicorn --reload
- Frontend changes auto-reload via Vite HMR

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React + Vite UI |
| Backend | 8000 | FastAPI API |

## Environment Variables

Create `.env` file in the root directory:

```env
# Backend settings (handled automatically in container)
DATABASE_URL=sqlite:///./data/quote.db
JWT_SECRET_KEY=your-secret-key
```

## Production Deployment

For production, build the frontend and serve via the backend:

```bash
cd frontend && npm run build
cd ../backend && # Configure for production
```
