#!/bin/bash

# quote-mvpp v2 Deployment Script
# Usage: ./deploy.sh [domain] [port]

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load configuration
if [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}❌ .env file not found! Copy .env.example to .env first.${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Deploying quote-mvpp v2 to $DOMAIN${NC}"

# Function to run sudo commands
run_sudo() {
    if [ "$EUID" -eq 0 ]; then
        eval "$@"
    else
        sudo -E env "PATH=$PATH" "$@"
    fi
}

# Ensure /tmp is writable
chmod 1777 /tmp 2>/dev/null || true

# ============================================
# Step 1: Install Node.js
# ============================================
echo -e "\n${YELLOW}📦 Step 1: Installing Node.js...${NC}"

if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
else
    echo "Downloading Node.js..."
    NODE_VERSION="v22.12.0"
    wget -q "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" -O "/tmp/node.tar.xz"
    
    echo "Extracting..."
    tar -xJf /tmp/node.tar.xz -C /tmp
    
    echo "Installing to /usr/local..."
    run_sudo mkdir -p /usr/local
    run_sudo mv "/tmp/node-$NODE_VERSION-linux-x64" /usr/local/
    run_sudo ln -sf "/usr/local/node-$NODE_VERSION-linux-x64/bin/node" /usr/local/bin/node
    run_sudo ln -sf "/usr/local/node-$NODE_VERSION-linux-x64/bin/npm" /usr/local/bin/npm
    
    rm -f /tmp/node.tar.xz
    
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
fi

# Verify npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi

# ============================================
# Step 2: Build Frontend
# ============================================
echo -e "\n${YELLOW}🎨 Step 2: Building frontend...${NC}"

cd "$FRONTEND_DIR"

# Install dependencies
echo "Installing npm dependencies..."
npm install --quiet

# Build
echo "Building frontend..."
npm run build

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Build failed! dist/index.html not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# ============================================
# Step 3: Create Nginx Config
# ============================================
echo -e "\n${YELLOW}🌐 Step 3: Creating nginx config...${NC}"

cat > "/tmp/nginx.conf" << EOF
server {
  listen 80;
  server_name $DOMAIN;
  return 301 https://\$host\$request_uri;
}

server {
  listen 443 ssl http2;
  server_name $DOMAIN;
  client_max_body_size 100m;

  ssl_certificate $SSL_CERT_PATH;
  ssl_certificate_key $SSL_KEY_PATH;

  root $FRONTEND_DIR/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:$BACKEND_PORT/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
}
EOF

run_sudo mv /tmp/nginx.conf /etc/nginx/sites-available/$DOMAIN
run_sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
run_sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${GREEN}✅ Nginx configured${NC}"

# ============================================
# Step 4: Start Services
# ============================================
echo -e "\n${YELLOW}🚀 Step 4: Starting services...${NC}"

# Start backend manually (no systemd)
pkill -f uvicorn || true
sleep 1

cd "$BACKEND_DIR"
nohup uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT > /tmp/backend.log 2>&1 &

# Reload nginx
run_sudo nginx -t && run_sudo systemctl reload nginx

echo -e "${GREEN}✅ Services started${NC}"

# ============================================
# Step 5: Verify
# ============================================
echo -e "\n${YELLOW}🔍 Verifying deployment...${NC}"

sleep 3

# Check backend
if curl -s "http://localhost:$BACKEND_PORT/health" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend healthy${NC}"
else
    echo -e "${RED}❌ Backend not responding${NC}"
fi

# Check frontend
if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    echo -e "${GREEN}✅ Frontend ready${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "URL: https://$DOMAIN"
echo "API: http://localhost:$BACKEND_PORT"
echo "Docs: https://$DOMAIN/docs"
echo ""
echo "Login: $ADMIN_USERNAME / $ADMIN_PASSWORD"
echo ""
