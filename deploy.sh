#!/bin/bash

# quote-mvpp v2 Deployment Script
# Easy deployment for quote.3djat.com or any domain
# Usage: ./deploy.sh

# Load configuration
if [ -f ".env" ]; then
    source .env
else
    echo "❌ .env file not found! Copy .env.example to .env and configure it."
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying quote-mvpp v2 to $DOMAIN${NC}"
echo "Backend port: $BACKEND_PORT"
echo "Project dir: $PROJECT_DIR"

# Check if running as root or have sudo
if [ "$EUID" -ne 0 ] && ! command -v sudo &> /dev/null; then
    echo -e "${YELLOW}Warning: Not running as root and sudo not available${NC}"
fi

# Function to run sudo commands
run_sudo() {
    if [ "$EUID" -eq 0 ]; then
        eval "$@"
    else
        sudo -E bash -c "$@"
    fi
}

# Step 1: Install Node.js
echo -e "\n${YELLOW}📦 Step 1: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    NODE_VERSION="v22.12.0"
    wget -q https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz
    tar -xJ node-$NODE_VERSION-linux-x64
    run_sudo mv node-$NODE_VERSION-linux-x64 /usr/local/
    run_sudo ln -sf /usr/local/node-$NODE_VERSION-linux-x64/bin/node /usr/local/bin/node
    run_sudo ln -sf /usr/local/node-$NODE_VERSION-linux-x64/bin/npm /usr/local/bin/npm
    rm node-$NODE_VERSION-linux-x64.tar.xz
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# Step 2: Install Python dependencies
echo -e "\n${YELLOW}🐍 Step 2: Installing Python dependencies...${NC}"
cd "$BACKEND_DIR"
pip install -q fastapi uvicorn sqlalchemy aiosqlite python-jose passlib[bcrypt] python-multipart
echo -e "${GREEN}✅ Python dependencies installed${NC}"

# Step 3: Build frontend
echo -e "\n${YELLOW}🎨 Step 3: Building frontend...${NC}"
cd "$FRONTEND_DIR"
npm install --quiet
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

# Step 4: Create nginx config
echo -e "\n${YELLOW}🌐 Step 4: Creating nginx config...${NC}"

cat > /tmp/nginx-$DOMAIN.conf << EOF
server {
  listen 80;
  server_name $DOMAIN;
  return 301 https://\$host\$request_uri;
}

server {
  listen 443 ssl http2;
  server_name $DOMAIN;

  client_max_body_size 100m;

  # SSL certificates
  ssl_certificate $SSL_CERT_PATH;
  ssl_certificate_key $SSL_KEY_PATH;

  # Serve v2 frontend
  root $FRONTEND_DIR/dist;
  index index.html;

  # API -> backend
  location /api/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/;
    proxy_http_version 1.1;

    proxy_connect_timeout 60s;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  # SPA routes
  location / {
    try_files \$uri \$uri/ /index.html;
  }

  # PWA cache control
  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location = /registerSW.js { add_header Cache-Control "no-cache"; }
}
EOF

run_sudo mv /tmp/nginx-$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN
run_sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
run_sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${GREEN}✅ Nginx config created for $DOMAIN${NC}"

# Step 5: Create systemd service
echo -e "\n${YELLOW}⚙️  Step 5: Creating systemd service...${NC}"

cat > /tmp/quote-mvpp.service << EOF
[Unit]
Description=quote-mvpp v2 Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/local/bin/uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT
Restart=always
RestartSec=10
Environment="PATH=$BACKEND_DIR/.venv/bin"

[Install]
WantedBy=multi-user.target
EOF

run_sudo mv /tmp/quote-mvpp.service /etc/systemd/system/
run_sudo systemctl daemon-reload
run_sudo systemctl enable quote-mvpp

echo -e "${GREEN}✅ Systemd service created${NC}"

# Step 6: Start services
echo -e "\n${YELLOW}🚀 Step 6: Starting services...${NC}"
run_sudo systemctl start quote-mvpp
run_sudo systemctl reload nginx

echo -e "${GREEN}✅ Services started${NC}"

# Step 7: Verify
echo -e "\n${YELLOW}🔍 Step 7: Verifying deployment...${NC}"
sleep 3

# Check backend
if curl -s http://127.0.0.1:$BACKEND_PORT/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Backend log:"
    sudo systemctl status quote-mvpp
fi

# Check frontend
if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    echo -e "${GREEN}✅ Frontend files exist${NC}"
else
    echo -e "${RED}❌ Frontend files not found${NC}"
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "==========================================="
echo -e "${GREEN}📝 Summary:${NC}"
echo "  Domain: https://$DOMAIN"
echo "  Backend: http://127.0.0.1:$BACKEND_PORT"
echo "  API Docs: https://$DOMAIN/docs"
echo "  Health: https://$DOMAIN/health"
echo ""
echo "Login credentials:"
echo "  Username: $ADMIN_USERNAME"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status quote-mvpp     # Check backend status"
echo "  sudo systemctl restart quote-mvpp     # Restart backend"
echo "  sudo journalctl -u quote-mvpp -f     # View backend logs"
echo "==========================================="
