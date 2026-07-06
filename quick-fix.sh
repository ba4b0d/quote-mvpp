#!/bin/bash

# quote-mvpp v2 Quick Fix Script
# Run on server to fix nginx and restart everything

echo "🔧 Fixing quote-mvpp v2..."

# Update nginx config
cat > /tmp/nginx-fix.conf << 'EOF'
server {
  listen 80;
  server_name quote.3djat.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name quote.3djat.com;
  client_max_body_size 100m;

  ssl_certificate /etc/letsencrypt/live/quote.3djat.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/quote.3djat.com/privkey.pem;

  root /opt/quote-mvpp/frontend/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
}
EOF

sudo mv /tmp/nginx-fix.conf /etc/nginx/sites-available/quote
sudo nginx -t && sudo systemctl reload nginx

# Restart backend
pkill -f uvicorn || true
sleep 2
cd /opt/quote-mvpp/backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 &

sleep 3

# Test
echo ""
echo "🔍 Testing..."
curl -s http://localhost:8001/health
echo ""
curl -skL https://quote.3djat.com/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'

echo ""
echo "✅ Done!"
