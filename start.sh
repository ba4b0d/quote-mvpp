#!/bin/bash

# quote-mvpp v2 - Startup Script
# Run this to start both backend and frontend

echo "🎉 Starting quote-mvpp v2..."
echo ""

# Kill any existing servers
pkill -f uvicorn 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Start Backend
echo "🔧 Starting Backend (port 8000)..."
cd /tmp/quote-mvpp/backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
sleep 3

if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend running at http://localhost:8000"
else
    echo "❌ Backend failed to start. Check /tmp/backend.log"
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend (port 5173)..."
cd /tmp/quote-mvpp/frontend
nohup npm run dev -- --host 0.0.0.0 > /tmp/frontend.log 2>&1 &
sleep 6

if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend running at http://localhost:5173"
else
    echo "❌ Frontend failed to start. Check /tmp/frontend.log"
fi

echo ""
echo "📍 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Quote:    http://localhost:5173/quote"
echo "   Admin:    http://localhost:5173/admin"
echo "   API:      http://localhost:8000"
echo ""
echo "🔑 Login: admin / admin123"
echo ""
echo "To view logs: tail -f /tmp/backend.log /tmp/frontend.log"
